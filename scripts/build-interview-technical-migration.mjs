import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const existing=new Map();
for(let offset=0;;offset+=1000){const {data,error}=await db.from('interview_questions').select('id,title').range(offset,offset+999);if(error)throw error;for(const row of data??[])existing.set(row.title.trim().toLocaleLowerCase(),row.id);if((data?.length??0)<1000)break;}
const reference=JSON.parse(readFileSync('data/interview-technical-reference.json','utf8'));
const q=(value)=>`'${String(value).replaceAll("'","''")}'`;
const insert=(table,cols,rows,chunkSize=200)=>{const lines=[];for(let i=0;i<rows.length;i+=chunkSize)lines.push(`insert into public.${table}(${cols}) values\n${rows.slice(i,i+chunkSize).join(',\n')}\non conflict do nothing;`);return lines.join('\n\n');};
const generated=new Map();const placements=[];const sheets=[];
reference.sheets.forEach((sheet,position)=>{
  sheets.push(`(${q(sheet.slug)},${q(sheet.title)},${q(sheet.group)},${q(sheet.sourceUrl)},${sheet.questions.length},${position})`);
  sheet.questions.forEach((question,index)=>{
    const key=question.title.trim().toLocaleLowerCase();
    let id=existing.get(key)??generated.get(key)?.id;
    if(!id){id=`tech-${createHash('sha256').update(key).digest('hex').slice(0,24)}`;generated.set(key,{id,title:question.title,sourceUrl:sheet.sourceUrl,difficulty:question.difficulty,category:question.category});}
    placements.push(`(${q(sheet.slug)},${q(id)},${index+1})`);
  });
});
const canonical=[...generated.values()].map(row=>`(${q(row.id)},${q(row.title)},'Interview topic',${q(row.sourceUrl)},${row.difficulty?q(row.difficulty):'null'},array[${q('Technical interview')},${q(row.category??'Fundamentals')}])`);
const sql=`-- Public technical-question metadata only. Reference answers are not copied.\ncreate table if not exists public.interview_technical_sheets (\n  slug text primary key, title text not null, group_name text not null,\n  source_url text not null, question_count integer not null check (question_count>=0),\n  position integer not null\n);\ncreate table if not exists public.interview_technical_questions (\n  sheet_slug text not null references public.interview_technical_sheets(slug) on delete cascade,\n  question_id text not null references public.interview_questions(id),\n  position integer not null, primary key(sheet_slug,position)\n);\ncreate index if not exists interview_technical_question_id_idx on public.interview_technical_questions(question_id);\nalter table public.interview_technical_sheets enable row level security;\nalter table public.interview_technical_questions enable row level security;\ncreate policy interview_technical_sheets_read on public.interview_technical_sheets for select to anon,authenticated using (true);\ncreate policy interview_technical_questions_read on public.interview_technical_questions for select to anon,authenticated using (true);\ngrant select on public.interview_technical_sheets,public.interview_technical_questions to anon,authenticated;\n\n${insert('interview_questions','id,title,source,url,difficulty,tags',canonical)}\n\n${insert('interview_technical_sheets','slug,title,group_name,source_url,question_count,position',sheets)}\n\n${insert('interview_technical_questions','sheet_slug,question_id,position',placements)}\n`;
writeFileSync('supabase/migrations/20261025110000_interview_technical_questions.sql',sql);
console.log(JSON.stringify({sheets:sheets.length,placements:placements.length,newCanonical:canonical.length,bytes:Buffer.byteLength(sql)}));
