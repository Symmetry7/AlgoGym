import {afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {readAiCredits,queueCreditPath,reconcilePathCredits} from './ai-credits';
import type {SupabaseClient} from '@supabase/supabase-js';
afterEach(()=>vi.unstubAllEnvs());
describe('AI credit boundary',()=>{
  it('does not invent a balance when rollout is disabled',async()=>{
    vi.stubEnv('SYMM_AI_CREDITS_ENABLED','false');const rpc=vi.fn();
    expect(await readAiCredits({rpc} as unknown as SupabaseClient,'owner')).toBeNull();expect(rpc).not.toHaveBeenCalled();
  });
  it('uses the authoritative wallet for the visible usage count',async()=>{
    vi.stubEnv('SYMM_AI_CREDITS_ENABLED','true');const rpc=vi.fn().mockResolvedValue({data:1,error:null});
    const from=vi.fn(()=>({select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),in:vi.fn().mockResolvedValue({data:[{delta:3}],error:null})}));
    expect(await readAiCredits({rpc,from} as unknown as SupabaseClient,'owner')).toEqual({available:1,allowance:3,used:2});
    expect(rpc).toHaveBeenCalledWith('ensure_ai_credit_wallet',{p_user:'owner'});
  });
  it('does not swallow insufficient-credit or database errors',async()=>{
    const rpc=vi.fn().mockResolvedValue({data:null,error:{message:'Insufficient AI credits'}});
    await expect(queueCreditPath({rpc} as unknown as SupabaseClient,'owner',{})).rejects.toEqual({message:'Insufficient AI credits'});
  });
});

describe('credit reconciliation', () => {
  const operation = 'path:11111111-1111-4111-8111-111111111111:0';
  function database(status: string | null, error: unknown = null) {
    const reservations = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({data:[{user_id:'owner',operation_key:operation}],error:null}),
    };
    const paths = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({data:status ? {status} : null,error}),
    };
    const rpc = vi.fn().mockResolvedValue({error:null});
    const from = vi.fn((table:string) => table === 'ai_credit_reservations' ? reservations : paths);
    return {admin:{from,rpc} as unknown as SupabaseClient,rpc,from,paths};
  }
  it.each([['ready',true],['failed',false],[null,false]])('reconciles terminal or deleted path %s', async (status,succeeded) => {
    vi.stubEnv('SYMM_AI_CREDITS_ENABLED','true');
    const db=database(status as string|null);
    await reconcilePathCredits(db.admin);
    expect(db.rpc).toHaveBeenCalledWith('finish_ai_credit_reservation',{
      p_user:'owner',p_operation_key:operation,p_succeeded:succeeded,
    });
    expect(db.paths.eq).toHaveBeenCalledWith('user_id','owner');
  });
  it('does not release an active generation',async()=>{
    vi.stubEnv('SYMM_AI_CREDITS_ENABLED','true');
    const db=database('generating');
    await reconcilePathCredits(db.admin);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('does not mistake a failed database read for a deleted path',async()=>{
    vi.stubEnv('SYMM_AI_CREDITS_ENABLED','true');
    const db=database(null,new Error('offline'));
    await expect(reconcilePathCredits(db.admin)).rejects.toThrow('offline');
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('does not access credit tables before rollout',async()=>{
    vi.stubEnv('SYMM_AI_CREDITS_ENABLED','false');
    const db=database('ready');
    await reconcilePathCredits(db.admin);
    expect(db.from).not.toHaveBeenCalled();
  });
});
