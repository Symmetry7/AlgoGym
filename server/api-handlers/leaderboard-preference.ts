import { z } from "zod";
import { originFromRequest, serverSupabase, type ApiRequest, type ApiResponse } from "../supabase";
export default async function handler(req:ApiRequest,res:ApiResponse){
  res.setHeader("Cache-Control","private, no-store");
  if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({error:"Method not allowed."});
  if(req.method==="POST"&&req.headers.origin&&req.headers.origin!==originFromRequest(req))return res.status(403).json({error:"This request could not be verified."});
  const {client,flushCookies}=serverSupabase(req,res);
  try{
    const {data:{user}}=await client.auth.getUser();
    if(!user)return res.status(401).json({error:"Sign in to save your college selection."});
    if(req.method==="POST"){
      const parsed=z.object({collegeId:z.string().uuid().nullable()}).strict().safeParse(req.body);
      if(!parsed.success)return res.status(400).json({error:"Choose a valid college."});
      const {error}=await client.rpc("set_leaderboard_college",{p_college:parsed.data.collegeId});
      if(error)return res.status(400).json({error:"College selection could not be saved."});
    }
    const {data:profile,error}=await client.from("profiles").select("college_id,preferences").eq("id",user.id).single();
    if(error)return res.status(503).json({error:"College preference is unavailable."});
    const preferred=profile.preferences?.leaderboard_college_id;
    const source=profile.preferences?.leaderboard_source_college_id;
    const saved=typeof preferred==="string"&&source===(profile.college_id??"")?preferred:profile.college_id;
    if(!saved)return res.status(200).json({college:null});
    const {data:college}=await client.from("colleges").select("id,name,city,state").eq("id",saved).eq("status","approved").maybeSingle();
    return res.status(200).json({college:college??null});
  }finally{flushCookies();}
}
