import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).map((line)=>{
  const i=line.indexOf('=');return i<0?[]:[line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')];
}).filter((item)=>item.length===2));
const client=createClient(env.SUPABASE_URL??env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY??env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const source=JSON.parse(readFileSync('data/interview-pattern-hr-reference.json','utf8'));
const patternManifest=JSON.parse(readFileSync('src/screens/interview-pattern-groups.json','utf8'));
async function rows(table,columns,field,value){
  const {data,error}=await client.from(table).select(columns).eq(field,value).order('position').range(0,999);
  if(error)throw error;return data??[];
}
const patterns=await rows('interview_category_questions','question_id,position','category_slug','patterns');
const ids=patternManifest.flatMap((group)=>group.ids);
if(source.groups.length!==patternManifest.length||ids.length!==180||new Set(ids).size!==178||patterns.length!==178)throw new Error('Pattern inventory mismatch');
if(patterns.some((item,index)=>item.question_id!==[...new Set(ids)][index]))throw new Error('Pattern placement order mismatch');
const slugs=[...new Set(ids)];
const questions=[];
for(let i=0;i<slugs.length;i+=100){const {data,error}=await client.from('interview_questions').select('id,url,title').in('id',slugs.slice(i,i+100));if(error)throw error;questions.push(...(data??[]));}
const byId=new Map(questions.map((item)=>[item.id,item]));
const flattened=source.groups.flatMap((group)=>group.problems);
const linkMismatches=[];
const normalizedPath=(url)=>new URL(url).pathname.replace(/\/description\/?$/,'').replace(/\/$/,'');
for(let i=0;i<ids.length;i++){const question=byId.get(ids[i]);const expected=flattened[i].url;if(!question||normalizedPath(question.url)!==normalizedPath(expected))linkMismatches.push(`${i+1}: ${ids[i]} ${question?.url} <> ${expected}`);}
if(linkMismatches.length)throw new Error(`Pattern link mismatches:\n${linkMismatches.join('\n')}`);
async function checkCategory(category,expected,required){
  const placements=await rows('interview_category_questions','question_id,position','category_slug',category);
  if(placements.length!==expected)throw new Error(`${category}: ${placements.length} rows`);
  const questionIds=placements.map((item)=>item.question_id);
  const [content,canonical]=await Promise.all([
    client.from('interview_question_content').select('question_id,answer_text,answer_code,article_url,video_url').in('question_id',questionIds),
    client.from('interview_questions').select('id,difficulty,tags').in('id',questionIds),
  ]);
  if(content.error||canonical.error)throw content.error??canonical.error;
  const byContent=new Map((content.data??[]).map((item)=>[item.question_id,item]));
  const byQuestion=new Map((canonical.data??[]).map((item)=>[item.id,item]));
  for(const id of questionIds){const detail=byContent.get(id);const question=byQuestion.get(id);if(!detail||!question||!question.difficulty||required.some((field)=>!detail[field]))throw new Error(`${category}: incomplete ${id}`);}
  return {rows:placements.length,content:byContent.size};
}
const sql=await checkCategory('sql',110,['answer_code']);
const hr=await checkCategory('hr-questions',100,['answer_text']);
const system=await checkCategory('system-design',32,['article_url','video_url']);
const write=await client.from('interview_question_content').insert({question_id:'sql-ref-001',answer_text:'unauthorized'});
if(!write.error)throw new Error('Anonymous write to answer content allowed');
console.log(JSON.stringify({result:'PASS',patternSections:patternManifest.length,patternPlacements:ids.length,patternCanonical:patterns.length,sql,hr,system,anonymousWritesDenied:true}));
