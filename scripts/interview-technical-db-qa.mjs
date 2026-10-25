import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
const reference=JSON.parse(readFileSync('data/interview-technical-reference.json','utf8'));
const {data:sheets,error:sheetError}=await client.from('interview_technical_sheets').select('slug,title,question_count').order('position');
if(sheetError)throw sheetError;
if(sheets.length!==28)throw new Error(`Expected 28 technical sheets, got ${sheets.length}`);
let total=0;
for(const sheet of reference.sheets){
  const stored=sheets.find(item=>item.slug===sheet.slug);
  if(!stored||stored.question_count!==sheet.questions.length||stored.title!==sheet.title)throw new Error(`Sheet metadata mismatch: ${sheet.slug}`);
  const {data:rows,error}=await client.from('interview_technical_questions').select('question_id,position').eq('sheet_slug',sheet.slug).order('position').range(0,999);
  if(error)throw error;
  if(rows.length!==sheet.questions.length||rows.some((row,index)=>row.position!==index+1))throw new Error(`Placement mismatch: ${sheet.slug}`);
  total+=rows.length;
}
if(total!==4531)throw new Error(`Expected 4531 placements; got ${total}`);
const illegal=await client.from('interview_technical_sheets').insert({slug:'qa-illegal',title:'Illegal',group_name:'QA',source_url:'https://example.com',question_count:0,position:999});
if(!illegal.error)throw new Error('Anonymous catalog write was permitted');
console.log(JSON.stringify({result:'PASS',sheets:sheets.length,placements:total,anonymousWritesDenied:true,referenceDifferences:['OOP lists 149 visible rows although its directory advertises 150','PostgreSQL lists 77 visible rows although its directory advertises 79']}));
