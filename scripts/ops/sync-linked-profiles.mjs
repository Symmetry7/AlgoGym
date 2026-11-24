import nextEnv from '@next/env';
import {createClient} from '@supabase/supabase-js';
nextEnv.loadEnvConfig(process.cwd());
const db=createClient(process.env.SUPABASE_URL??process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:accounts,error}=await db.from('coding_profiles').select('user_id,platform');if(error)throw new Error('Verified profile inventory could not be read.');
for(const account of accounts){const {data:pending,error:pendingError}=await db.from('sync_jobs').select('id').eq('user_id',account.user_id).eq('provider',account.platform).in('status',['queued','running','retrying']);if(pendingError)throw new Error('The queue could not be inspected.');if(!pending.length){const {error}=await db.from('sync_jobs').insert({user_id:account.user_id,provider:account.platform});if(error&&error.code!=='23505')throw new Error('The verified profile could not be queued.');}}
for(let round=0;round<30;round++){
 const response=await fetch('http://localhost:8080/api/jobs/sync',{method:'POST',headers:{Authorization:`Bearer ${process.env.CRON_SECRET}`},signal:AbortSignal.timeout(65000)});if(!response.ok)throw new Error(`Worker HTTP ${response.status}`);
 const {data:jobs,error}=await db.from('sync_jobs').select('provider,status,error_code,run_after').in('status',['queued','running','retrying','failed']);if(error)throw new Error('Queue status could not be read.');console.log(JSON.stringify({round,statuses:jobs.map(({provider,status,error_code})=>({provider,status,error_code}))}));
 const active=jobs.filter(job=>['queued','running','retrying'].includes(job.status));if(!active.length)break;if(active.every(job=>Date.parse(job.run_after)>Date.now()+5000))break;await new Promise(resolve=>setTimeout(resolve,2200));
}
const {data:snapshots,error:snapshotError}=await db.from('provider_snapshots').select('provider,summary,history_complete,submissions_complete,last_synced_at');if(snapshotError)throw new Error('Synchronized snapshot inventory could not be read.');
const totals={};for(const table of ['provider_submissions','provider_rating_history','solves','chakra_awards']){const {count,error}=await db.from(table).select('id',{count:'exact',head:true});if(error)throw new Error('The evidence inventory could not be read.');totals[table]=count;}
console.log(JSON.stringify({verifiedAccounts:accounts.length,snapshots:snapshots.map(snapshot=>({...snapshot,summary:{rating:snapshot.summary.rating??null,totalSolved:snapshot.summary.totalSolved??null,ratedContests:snapshot.summary.ratedContests??null}})),totals},null,2));
