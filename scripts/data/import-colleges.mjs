import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { mkdirSync,writeFileSync } from 'node:fs';
nextEnv.loadEnvConfig(process.cwd());
const apply=process.argv.includes('--apply');
const repo='arpitagarwala/indian-institutions-data';
const sourceArg=process.argv.find((arg)=>arg.startsWith('--source-ref='))?.split('=')[1];
const get=async(url)=>{const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'AlgoGym college-directory importer'},signal:AbortSignal.timeout(90_000)});if(!response.ok)throw new Error(`Source returned HTTP ${response.status}`);return response;};
const commit=sourceArg??(await(await get(`https://api.github.com/repos/${repo}/commits/main`)).json()).sha;
if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('Use a full pinned source commit.');
const raw=await(await get(`https://raw.githubusercontent.com/${repo}/${commit}/data/json/all_institutions.json`)).text();
const payload=JSON.parse(raw);const input=Array.isArray(payload)?payload:payload.institutions??payload.data;
if(!Array.isArray(input))throw new Error(`Unexpected source shape: ${Object.keys(payload).join(',')}`);
const normalize=(value)=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const acronym=(name)=>normalize(name).split(' ').filter((word)=>!['of','the','and','for','at','in'].includes(word)).map((word)=>word[0]).join('');
function stableId(code){const hash=createHash('sha256').update(`algogym:aishe:${code}`).digest('hex').slice(0,32);return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20)}`;}
const records=new Map();let invalid=0;let duplicateCodes=0;
for(const item of input){const code=String(item.aisheCode??'').trim().toUpperCase();const name=String(item.name??'').replace(/\s+/g,' ').trim();const state=String(item.stateName??'').trim();const city=String(item.districtName??'').trim();if(!/^[UCS]-\d+$/.test(code)||name.length<3||name.length>200||!state){invalid++;continue;}if(records.has(code)){duplicateCodes++;continue;}records.set(code,{id:stableId(code),slug:`aishe-${code.toLowerCase()}`,name,normalized_name:normalize(`${name} ${city} ${state}`),city:city||null,state,status:'approved',source:'AISHE-community-snapshot',source_ref:code,source_updated_at:new Date().toISOString(),acronym:acronym(name)});}
const canonical=new Map();const ambiguous=[];const ambiguousNames=new Set();
for(const record of records.values()){if(ambiguousNames.has(record.normalized_name)){ambiguous.push(record.source_ref);continue;}if(canonical.has(record.normalized_name)){ambiguous.push(canonical.get(record.normalized_name).source_ref,record.source_ref);canonical.delete(record.normalized_name);ambiguousNames.add(record.normalized_name);continue;}canonical.set(record.normalized_name,record);}
const report={repository:`https://github.com/${repo}`,commit,sha256:createHash('sha256').update(raw).digest('hex'),sourceRows:input.length,accepted:canonical.size,invalid,duplicateCodes,ambiguousCount:ambiguous.length,ambiguousSourceRefs:ambiguous,applied:apply,capturedAt:new Date().toISOString()};
mkdirSync('.local-backups',{recursive:true});writeFileSync('.local-backups/college-source-review.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,ambiguousSourceRefs:undefined}));
if(!apply)process.exit(0);
const url=process.env.SUPABASE_URL??process.env.VITE_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Server credentials are required for the import.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const existing=new Map();for(let start=0;;start+=1000){const {data,error}=await db.from('colleges').select('id,source_ref,status,normalized_name').range(start,start+999);if(error)throw new Error(error.message);for(const item of data)existing.set(item.source_ref,item);if(data.length<1000)break;}
const rows=[...canonical.values()].map((item)=>{const old=existing.get(item.source_ref);return old?{...item,id:old.id,status:old.status}:item;});
for(let index=0;index<rows.length;index+=500){const {error}=await db.from('colleges').upsert(rows.slice(index,index+500),{onConflict:'id'});if(error)throw new Error(`Import stopped safely at offset ${index}: ${error.message}`);if(index%10_000===0)console.log(JSON.stringify({imported:Math.min(index+500,rows.length),total:rows.length}));}
console.log(JSON.stringify({imported:rows.length,sourceCommit:commit}));
