import { z } from "zod";
import { adminSupabase } from "../admin";
import { codeforcesContestCatalog, resolveCodeforcesContestProblem } from "../codeforces-contest-catalog";
import { syncSocietyContest } from "../society-contest-sync";
import { originFromRequest, serverSupabase, type ApiRequest, type ApiResponse } from "../supabase";
const uuid = z.string().uuid();
const iso = z.string().datetime({ offset: true });
const actions = z.discriminatedUnion("action", [
  z.object({ action:z.literal("create"), societyId:uuid, title:z.string().trim().min(3).max(160), description:z.string().max(5000).default(""), instructions:z.string().max(10000).default(""), startsAt:iso, endsAt:iso, registrationDeadline:iso, scoring:z.enum(["icpc","points"]), visibility:z.enum(["members","invite","public_view"]).default("members"), wrongPenalty:z.number().int().min(0).max(120).default(20), freezeAt:iso.nullable().default(null) }).strict(),
  z.object({ action:z.literal("update"), contestId:uuid, title:z.string().trim().min(3).max(160), description:z.string().max(5000), instructions:z.string().max(10000), startsAt:iso, endsAt:iso, registrationDeadline:iso, scoring:z.enum(["icpc","points"]), visibility:z.enum(["members","invite","public_view"]), wrongPenalty:z.number().int().min(0).max(120), freezeAt:iso.nullable() }).strict(),
  z.object({ action:z.literal("addProblem"), contestId:uuid, label:z.string().regex(/^[A-Z][A-Z]?$/), problemId:z.string().min(2).max(500), score:z.number().int().min(1).max(10000) }).strict(),
  z.object({ action:z.literal("removeProblem"), problemId:uuid }).strict(),
  z.object({ action:z.literal("reorderProblems"), contestId:uuid, items:z.array(z.object({id:uuid,score:z.number().int().min(1).max(10000)}).strict()).max(26) }).strict(),
  z.object({ action:z.literal("setEditor"), contestId:uuid, userId:uuid, approved:z.boolean() }).strict(),
  z.object({ action:z.literal("state"), contestId:uuid, state:z.enum(["published","finalized","archived"]) }).strict(),
  z.object({ action:z.literal("register"), contestId:uuid }).strict(),
  z.object({ action:z.literal("claim"), problemId:uuid, proofUrl:z.string().url().max(500) }).strict(),
  z.object({ action:z.literal("verify"), submissionId:uuid, accept:z.boolean() }).strict(),
  z.object({ action:z.literal("syncCodeforces"), contestId:uuid }).strict(),
  z.object({ action:z.literal("deleteContest"), contestId:uuid }).strict(),
]);
export default async function handler(req:ApiRequest,res:ApiResponse) {
  res.setHeader("Cache-Control","private, no-store");
  if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({error:"Method not allowed."});
  if(req.method==="POST"&&req.headers.origin&&req.headers.origin!==originFromRequest(req))return res.status(403).json({error:"This request could not be verified."});
  const {client,flushCookies}=serverSupabase(req,res);
  try {
    const {data:{user}}=await client.auth.getUser();
    if(!user)return res.status(401).json({error:"Sign in to use society contests."});
    if(req.method==="GET") {
      const params=new URL(req.url??"/","http://localhost").searchParams;
      const contestId=params.get("contestId");const societyId=params.get("societyId");
      if(params.has("catalog")) {
        if(!societyId||!uuid.safeParse(societyId).success)return res.status(400).json({error:"Choose a society."});
        const {data:canManage,error:permissionError}=await client.rpc("society_can",{p_society:societyId,p_action:"manage_contests"});
        let canEdit=false;
        if(contestId&&uuid.safeParse(contestId).success){
          const permission=await client.rpc("contest_can_edit",{p_contest:contestId});
          canEdit=!permission.error&&Boolean(permission.data);
        }
        if(permissionError||(!canManage&&!canEdit))return res.status(403).json({error:"Contest editor access required."});
        const requested=params.get("id");
        if(requested) {
          try { return res.status(200).json({problem:await resolveCodeforcesContestProblem(requested)}); }
          catch(error) { return res.status(422).json({error:error instanceof Error?error.message:"Problem unavailable."}); }
        }
        try {
          const query=(params.get("q")??"").trim().toLowerCase().slice(0,80);
          const tag=(params.get("tag")??"").trim().toLowerCase().slice(0,50);
          const contest=Number(params.get("contestIdFilter")??0);
          const min=Number(params.get("minRating")??0);
          const max=Number(params.get("maxRating")??0);
          const page=Math.min(100,Math.max(0,Number(params.get("page")??0)||0));
          const filtered=(await codeforcesContestCatalog()).filter(p=>
            (!query||p.name.toLowerCase().includes(query)||p.key.toLowerCase().includes(query))&&
            (!tag||p.tags.some(t=>t.toLowerCase()===tag))&&
            (!contest||p.contestId===contest)&&(!min||(p.rating??0)>=min)&&(!max||(p.rating??Infinity)<=max));
          return res.status(200).json({problems:filtered.slice(page*50,page*50+50),total:filtered.length,page});
        } catch(error) { return res.status(503).json({error:error instanceof Error?error.message:"Codeforces catalog is temporarily unavailable."}); }
      }
      if(contestId) {
        if(!uuid.safeParse(contestId).success)return res.status(400).json({error:"Invalid contest."});
        const standings=params.get("view")==="standings";
        const {data,error}=await client.rpc(standings?"read_society_contest_standings":"read_society_contest",{p_contest:contestId});
        if(error)return res.status(/unavailable|membership/i.test(error.message)?403:503).json({error:error.message});
        return res.status(200).json(data);
      }
      if(!societyId||!uuid.safeParse(societyId).success)return res.status(400).json({error:"Choose a society."});
      const {data,error}=await client.rpc("read_society_contests",{p_society:societyId});
      if(error)return res.status(/membership/i.test(error.message)?403:503).json({error:error.message});
      return res.status(200).json({contests:data??[]});
    }
    const parsed=actions.safeParse(req.body);
    if(!parsed.success)return res.status(400).json({error:"Check the contest details."});
    const a=parsed.data;
    if(a.action==="syncCodeforces") {
      const {data:canEdit,error:permissionError}=await client.rpc("contest_can_edit",{p_contest:a.contestId});
      if(permissionError||!canEdit)return res.status(403).json({error:"Contest editor access required."});
      try { return res.status(200).json({result:await syncSocietyContest(a.contestId)}); }
      catch(error) { return res.status(503).json({error:error instanceof Error?error.message:"Codeforces sync failed."}); }
    }
    let rpc:string;let args:Record<string,unknown>;
    switch(a.action) {
      case "create":rpc="create_society_contest";args={p_society:a.societyId,p_title:a.title,p_description:a.description,p_instructions:a.instructions,p_starts_at:a.startsAt,p_ends_at:a.endsAt,p_registration_deadline:a.registrationDeadline,p_scoring:a.scoring,p_visibility:a.visibility,p_wrong_penalty:a.wrongPenalty,p_freeze_at:a.freezeAt};break;
      case "update":rpc="update_society_contest";args={p_contest:a.contestId,p_title:a.title,p_description:a.description,p_instructions:a.instructions,p_starts_at:a.startsAt,p_ends_at:a.endsAt,p_registration_deadline:a.registrationDeadline,p_scoring:a.scoring,p_visibility:a.visibility,p_wrong_penalty:a.wrongPenalty,p_freeze_at:a.freezeAt};break;
      case "addProblem": {
        const {data:canEdit,error:permissionError}=await client.rpc("contest_can_edit",{p_contest:a.contestId});
        if(permissionError||!canEdit)return res.status(403).json({error:"Contest editor access required."});
        let problem;
        try { problem=await resolveCodeforcesContestProblem(a.problemId); }
        catch(error) { return res.status(422).json({error:error instanceof Error?error.message:"Codeforces problem unavailable."}); }
        const {error:catalogError}=await adminSupabase().from("problems").upsert({provider:"codeforces",external_problem_id:`${problem.contestId}:${problem.index}`,title:problem.name,url:problem.url,cf_rating:problem.rating,tags:problem.tags,active:true,last_synced_at:new Date().toISOString()},{onConflict:"provider,external_problem_id"});
        if(catalogError)return res.status(503).json({error:"Could not cache the verified Codeforces problem."});
        rpc="add_society_contest_problem";args={p_contest:a.contestId,p_label:a.label,p_source:"codeforces",p_title:problem.name,p_url:problem.url,p_difficulty:problem.rating?String(problem.rating):"",p_tags:problem.tags.slice(0,12),p_score:a.score,p_statement:null};break;
      }
      case "removeProblem":rpc="remove_society_contest_problem";args={p_problem:a.problemId};break;
      case "reorderProblems":rpc="reorder_society_contest_problems";args={p_contest:a.contestId,p_items:a.items};break;
      case "setEditor":rpc="set_society_contest_editor";args={p_contest:a.contestId,p_user:a.userId,p_approved:a.approved};break;
      case "state":rpc="set_society_contest_state";args={p_contest:a.contestId,p_state:a.state};break;
      case "register":rpc="register_society_contest";args={p_contest:a.contestId};break;
      case "claim":rpc="claim_society_contest_submission";args={p_problem:a.problemId,p_proof_url:a.proofUrl};break;
      case "verify":rpc="verify_society_contest_submission";args={p_submission:a.submissionId,p_accept:a.accept};break;
      case "deleteContest":rpc="delete_society_contest";args={p_contest:a.contestId};break;
    }
    const {data,error}=await client.rpc(rpc,args);
    if(error)return res.status(/not authorized|membership/i.test(error.message)?403:400).json({error:error.message});
    return res.status(200).json({result:data});
  } finally {flushCookies();}
}
