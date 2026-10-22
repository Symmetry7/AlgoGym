import "server-only";
import { Resend } from "resend";
import { adminSupabase } from "./admin";

export type SocietyEmail = { id:string; recipient_email:string; subject:string; body:string; href:string; attempts:number };
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[char]!);
export function societyEmailHtml(email:Pick<SocietyEmail,"subject"|"body"|"href">) {
  const base="https://algogym.vercel.app";
  const candidate=new URL(email.href,base);
  const href=email.href.startsWith("/")&&candidate.origin===base?candidate.toString():base;
  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#101116;color:#ecebf2;font-family:Arial,sans-serif"><main style="max-width:560px;margin:32px auto;padding:32px;background:#1b1c22;border:1px solid #35343f;border-radius:12px"><p style="color:#c4a7ef;font-weight:700;letter-spacing:.08em">ALGOGYM</p><h1 style="font-size:25px;line-height:1.25">${escapeHtml(email.subject)}</h1><p style="line-height:1.65;color:#cbc9d3">${escapeHtml(email.body)}</p><p style="margin:28px 0"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#c4a7ef;color:#141119;text-decoration:none;font-weight:700">Open AlgoGym</a></p><p style="color:#9996a3;font-size:12px">You can manage society email notifications in your account.</p></main></body></html>`;
}

export async function processSocietyEmailOutbox(limit=10) {
  const key=process.env.RESEND_API_KEY;
  const from=process.env.RESEND_FROM_EMAIL;
  if(!key||!from)return {sent:0,failed:0,skipped:"Email sender is not configured."};
  // Resend's shared development domain can only send to the account owner.
  // Explicitly allowlist that recipient until an independently owned domain is verified.
  const testRecipient=process.env.RESEND_TEST_RECIPIENT?.toLowerCase();
  if(from.toLowerCase().includes("onboarding@resend.dev")&&!testRecipient)
    return {sent:0,failed:0,skipped:"Set RESEND_TEST_RECIPIENT for development-domain delivery."};
  const db=adminSupabase();
  const {data:items,error}=await db.rpc("claim_society_email_batch",{p_limit:Math.min(limit,20)});
  if(error)throw error;
  const resend=new Resend(key);
  let sent=0,failed=0;
  for(const item of (items??[]) as SocietyEmail[]) {
    if(testRecipient&&from.toLowerCase().includes("onboarding@resend.dev")&&item.recipient_email.toLowerCase()!==testRecipient){
      await db.from("society_email_outbox").update({status:"pending",next_attempt_at:new Date(Date.now()+24*3600_000).toISOString(),locked_until:null,attempts:item.attempts-1}).eq("id",item.id);
      continue;
    }
    try {
      const result=await resend.emails.send({from,to:item.recipient_email,subject:item.subject,html:societyEmailHtml(item)},
        {idempotencyKey:`society-notification/${item.id}`});
      if(result.error)throw new Error(result.error.message);
      const {error:saveError}=await db.from("society_email_outbox").update({status:"sent",provider_id:result.data?.id??null,sent_at:new Date().toISOString(),locked_until:null,last_error:null}).eq("id",item.id);
      if(saveError)throw saveError;
      sent++;
    } catch(error) {
      const final=item.attempts>=5;
      const delay=Math.min(24*3600_000,60_000*2**Math.min(item.attempts,8));
      await db.from("society_email_outbox").update({status:final?"failed":"pending",locked_until:null,next_attempt_at:new Date(Date.now()+delay).toISOString(),last_error:error instanceof Error?error.message.slice(0,240):"Delivery failed"}).eq("id",item.id);
      failed++;
    }
  }
  return {sent,failed};
}
