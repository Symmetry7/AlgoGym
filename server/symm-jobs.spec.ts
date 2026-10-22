import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({adminSupabase:vi.fn()}));
vi.mock('./symm-ai', () => ({generateRoadmap:vi.fn(),generateLesson:vi.fn()}));
vi.mock('./ai-credits', () => ({finishPathCredit:vi.fn(),reconcilePathCredits:vi.fn()}));
import { adminSupabase } from './admin';
import { generateRoadmap } from './symm-ai';
import { finishPathCredit } from './ai-credits';
import { processSymmPathJob } from './symm-jobs';

afterEach(() => vi.restoreAllMocks());
describe('saved roadmap recovery', () => {
  it.each([false,true])('preserves a ready roadmap when settlement fails: %s',async(fails)=>{
    vi.mocked(generateRoadmap).mockClear();
    vi.mocked(finishPathCredit).mockReset();
    if(fails) vi.mocked(finishPathCredit).mockRejectedValue(new Error('database unavailable'));
    else vi.mocked(finishPathCredit).mockResolvedValue(undefined);
    vi.spyOn(console,'error').mockImplementation(()=>{});
    const jobs = {
      update:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),select:vi.fn().mockReturnThis(),
      maybeSingle:vi.fn().mockResolvedValue({data:{id:'job',user_id:'owner',attempt_count:1},error:null}),
    };
    const paths = {
      select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),update:vi.fn().mockReturnThis(),
      single:vi.fn().mockResolvedValue({data:{id:'path',status:'ready'},error:null}),
    };
    vi.mocked(adminSupabase).mockReturnValue({from:(table:string)=>table==='ai_generation_jobs'?jobs:paths} as unknown as ReturnType<typeof adminSupabase>);
    await processSymmPathJob('path',false);
    expect(generateRoadmap).not.toHaveBeenCalled();
    expect(paths.update).not.toHaveBeenCalled();
    expect(finishPathCredit).toHaveBeenCalledWith(expect.anything(),'owner','path',true);
    expect(finishPathCredit).not.toHaveBeenCalledWith(expect.anything(),'owner','path',false);
    expect(jobs.update).not.toHaveBeenCalledWith(expect.objectContaining({status:'failed'}));
  });
});
