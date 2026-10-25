import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const source = JSON.parse(readFileSync('data/interview-pattern-hr-reference.json','utf8'));
const env = Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).map((line) => {
  const i = line.indexOf('=');
  return i < 0 ? [] : [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')];
}).filter((item)=>item.length===2));
const client = createClient(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const existing = [];
for (let offset=0;;offset+=1000) {
  const {data,error}=await client.from('interview_questions').select('id,url').ilike('url','%leetcode.com%').range(offset,offset+999);
  if (error) throw error;
  existing.push(...(data??[]));
  if ((data?.length??0)<1000) break;
}
const slugOf = (url) => new URL(url).pathname.match(/\/problems\/([^/]+)/)?.[1];
const bySlug = new Map(existing.map((item)=>[slugOf(item.url),item.id]));
const candidateIds=[...new Set(source.groups.flatMap((group)=>group.problems.map((item)=>`lc-${slugOf(item.url)}`)))];
const takenIds=new Set();
for(let offset=0;offset<candidateIds.length;offset+=100){
  const {data,error}=await client.from('interview_questions').select('id').in('id',candidateIds.slice(offset,offset+100));
  if(error)throw error;
  for(const item of data??[])takenIds.add(item.id);
}
const byId = new Map();
const groups = source.groups.map((group)=>({topic:group.topic,subTopic:group.subTopic,ids:group.problems.map((item)=>{
  const slug=slugOf(item.url);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid LeetCode URL ${item.url}`);
  const candidate=`lc-${slug}`;
  const id=bySlug.get(slug)??(takenIds.has(candidate)?`pattern-${slug}`:candidate);
  if (!byId.has(id)) byId.set(id,{id,title:item.title,url:`https://leetcode.com/problems/${slug}/`,difficulty:item.difficulty,topic:group.topic});
  return id;
})}));
const rows=[...byId.values()];
const quote=(value)=>`'${String(value).replaceAll("'","''")}'`;
const added=rows.filter((row)=>!existing.some((item)=>item.id===row.id));
const sql=`-- Replace editorial pattern groupings with the 180 publicly linked LeetCode placements.
-- Existing canonical IDs and user progress are retained; the previous placements are backed up.
create schema if not exists private;
create table if not exists private.interview_pattern_placements_before_20261025 as
select * from public.interview_category_questions where category_slug='patterns';
revoke all on private.interview_pattern_placements_before_20261025 from anon,authenticated;
insert into public.interview_questions(id,title,source,url,difficulty,tags) values
${added.map((row)=>`(${[row.id,row.title,'LeetCode',row.url,row.difficulty].map(quote).join(',')},array[${quote(row.topic)}])`).join(',\n')}
on conflict(id) do nothing;
delete from public.interview_category_questions where category_slug='patterns';
insert into public.interview_category_questions(category_slug,question_id,position) values
${rows.map((row,index)=>`('patterns',${quote(row.id)},${index})`).join(',\n')};
`;
writeFileSync('supabase/migrations/20261025090000_interview_patterns_180.sql',sql);
writeFileSync('src/screens/interview-pattern-groups.json',`${JSON.stringify(groups,null,2)}\n`);
console.log(JSON.stringify({sourcePlacements:groups.reduce((n,group)=>n+group.ids.length,0),uniqueQuestions:rows.length,newCanonical:added.length,groups:groups.length}));
