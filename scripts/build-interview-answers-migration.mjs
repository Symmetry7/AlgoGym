import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { sqlAnswers, hrAnswers } from '../data/interview-original-answers.mjs';

const collections = JSON.parse(readFileSync('data/interview-reference-collections.json','utf8'));
const hr = JSON.parse(readFileSync('data/interview-pattern-hr-reference.json','utf8')).hr;
const env = Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).map((line)=>{
  const i=line.indexOf('='); return i<0?[]:[line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')];
}).filter((item)=>item.length===2));
const client=createClient(env.SUPABASE_URL??env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const read = async (table,columns,field,value) => {
  const {data,error}=await client.from(table).select(columns).eq(field,value).range(0,999);
  if(error)throw error;
  return data??[];
};
const existingQuestions=await read('interview_questions','id,title,source','source','System design');
const systemByTitle=new Map(existingQuestions.map((item)=>[item.title.toLowerCase(),item.id]));
const oldHrPlacements=await read('interview_category_questions','question_id,position','category_slug','hr-questions');
const oldIds=oldHrPlacements.map((item)=>item.question_id);
const oldHrQuestions=oldIds.length?(await client.from('interview_questions').select('id,title').in('id',oldIds)).data??[]:[];
const oldHrByTitle=new Map(oldHrQuestions.map((item)=>[item.title.trim().toLowerCase(),item.id]));
const claimed=new Set();
const hrRows=hr.map((item)=>{
  const key=item.title.trim().toLowerCase();
  const reusable=oldHrByTitle.get(key);
  const id=reusable&&!claimed.has(reusable)?reusable:`hr-ref-${String(item.index).padStart(3,'0')}`;
  claimed.add(id);
  return {...item,id};
});
const systemRows=collections.system.map((item)=>({...item,id:systemByTitle.get(item.title.toLowerCase())}));
if(systemRows.some((item)=>!item.id))throw new Error('Missing canonical system-design question');
if(hrRows.length!==100||sqlAnswers.length!==110||hrAnswers.length!==100)throw new Error('Answer inventory mismatch');
const levels=[
  'Medium','Easy','Hard','Hard','Hard','Hard','Medium','Hard','Hard','Hard','Hard','Medium','Medium','Hard','Medium','Hard',
  'Medium','Hard','Hard','Medium','Hard','Hard','Hard','Medium','Medium','Medium','Hard','Hard','Medium','Easy','Easy','Hard',
];
const q=(value)=>value==null?'null':`'${String(value).replaceAll("'","''")}'`;
const sqlRows=collections.sql.map((item,index)=>`(${q(`sql-ref-${String(item.index).padStart(3,'0')}`)},null,${q(sqlAnswers[index])},null,null)`);
const hrQuestionRows=hrRows.map((item)=>`(${[item.id,item.title,'AlgoGym answer','https://algogym.vercel.app/interview-preparations/hr-questions',item.difficulty==='Beginner'?'Easy':item.difficulty==='Intermediate'?'Medium':'Hard'].map(q).join(',')},array[${q(item.category??'HR')}])`);
const hrAnswerRows=hrRows.map((item,index)=>`(${q(item.id)},${q(hrAnswers[index])},null,null,null)`);
const systemContent=systemRows.map((item)=>`(${q(item.id)},null,null,${q(item.articleUrl||null)},${q(item.videoUrl||null)})`);
const sql=`-- Original AlgoGym SQL examples and HR answer frameworks; public system resources.
-- The original SQL/HR category placements are preserved before updating; no user state is deleted.
create schema if not exists private;
create table if not exists private.interview_hr_placements_before_answers_20261025 as
select * from public.interview_category_questions where category_slug='hr-questions';
revoke all on private.interview_hr_placements_before_answers_20261025 from anon,authenticated;

create table if not exists public.interview_question_content (
  question_id text primary key references public.interview_questions(id) on delete cascade,
  answer_text text,
  answer_code text,
  article_url text check(article_url is null or article_url ~ '^https://'),
  video_url text check(video_url is null or video_url ~ '^https://')
);
alter table public.interview_question_content enable row level security;
create policy interview_question_content_read on public.interview_question_content
  for select to anon,authenticated using (exists(select 1 from public.interview_questions q where q.id=question_id and q.published));
grant select on public.interview_question_content to anon,authenticated;

insert into public.interview_questions(id,title,source,url,difficulty,tags) values
${hrQuestionRows.join(',\n')}
on conflict(id) do update set title=excluded.title,source=excluded.source,url=excluded.url,difficulty=excluded.difficulty,tags=excluded.tags;
delete from public.interview_category_questions where category_slug='hr-questions';
insert into public.interview_category_questions(category_slug,question_id,position) values
${hrRows.map((item,index)=>`('hr-questions',${q(item.id)},${index})`).join(',\n')};

insert into public.interview_question_content(question_id,answer_text,answer_code,article_url,video_url) values
${[...sqlRows,...hrAnswerRows,...systemContent].join(',\n')}
on conflict(question_id) do update set answer_text=excluded.answer_text,answer_code=excluded.answer_code,article_url=excluded.article_url,video_url=excluded.video_url;

${systemRows.map((item,index)=>`update public.interview_questions set difficulty=${q(levels[index])} where id=${q(item.id)};`).join('\n')}
`;
writeFileSync('supabase/migrations/20261025091500_interview_answers_resources.sql',sql);
console.log(JSON.stringify({sql:sqlRows.length,hr:hrRows.length,system:systemRows.length,reusedHr:hrRows.filter((item)=>oldIds.includes(item.id)).length}));
