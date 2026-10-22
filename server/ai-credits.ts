import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
export const creditsEnabled=()=>process.env.SYMM_AI_CREDITS_ENABLED==='true';
export async function readAiCredits(admin:SupabaseClient,userId:string) {
  if(!creditsEnabled())return null;
  const {data,error}=await admin.rpc('ensure_ai_credit_wallet',{p_user:userId});
  if(error)throw error;
  if(!Number.isInteger(data)||data<0)throw new Error('Invalid credit wallet');
  const grants=await admin.from('ai_credit_ledger').select('delta').eq('user_id',userId).in('entry_type',['signup_grant','plan_grant','coin_exchange']);
  if(grants.error)throw grants.error;
  const allowance=(grants.data??[]).reduce((sum,row)=>sum+row.delta,0);
  return {available:data as number,allowance,used:Math.max(0,allowance-data)};
}
export async function queueCreditPath(admin:SupabaseClient,userId:string,input:Record<string,unknown>) {
  const result=await admin.rpc('queue_symm_credit_path',{p_user:userId,p_input:input});
  if(result.error)throw result.error;
  return result.data as {pathId:string;status:string};
}
export async function finishPathCredit(admin:SupabaseClient,userId:string,pathId:string,succeeded:boolean) {
  if(!creditsEnabled())return;
  const {data,error}=await admin.from('ai_credit_reservations').select('operation_key').eq('user_id',userId).like('operation_key',`path:${pathId}:%`).eq('status','reserved');
  if(error)throw error;
  for(const reservation of data??[]){
    const result=await admin.rpc('finish_ai_credit_reservation',{p_user:userId,p_operation_key:reservation.operation_key,p_succeeded:succeeded});
    if(result.error)throw result.error;
  }
}

// Retry accounting independently of generation. A transient accounting failure
// must never discard an already saved roadmap or leave a failed one charged.
export async function reconcilePathCredits(admin: SupabaseClient) {
  if (!creditsEnabled()) return;
  const { data, error } = await admin.from('ai_credit_reservations')
    .select('user_id,operation_key').eq('status', 'reserved')
    .order('updated_at').limit(100);
  if (error) throw error;
  for (const reservation of data ?? []) {
    const match = /^path:([0-9a-f-]{36}):\d+$/i.exec(reservation.operation_key);
    if (!match) continue;
    const path = await admin.from('ai_learning_paths').select('status')
      .eq('id', match[1]).eq('user_id', reservation.user_id).maybeSingle();
    if (path.error) throw path.error;
    if (path.data && !['ready', 'failed'].includes(path.data.status)) continue;
    const result = await admin.rpc('finish_ai_credit_reservation', {
      p_user: reservation.user_id,
      p_operation_key: reservation.operation_key,
      p_succeeded: path.data?.status === 'ready',
    });
    if (result.error) throw result.error;
  }
}
