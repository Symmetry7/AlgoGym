import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { sqlAnswers } from '../data/interview-original-answers.mjs';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).map((line) => {
  const separator = line.indexOf('=');
  return separator < 0 ? [] : [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')];
}).filter((entry) => entry.length === 2));
const client = createClient(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const ids = sqlAnswers.map((_, index) => `sql-ref-${String(index + 1).padStart(3, '0')}`);
const {data, error} = await client.from('interview_question_content').select('question_id,answer_code').in('question_id', ids);
if (error) throw error;
const answers = new Map((data ?? []).map((row) => [row.question_id, row.answer_code]));
if (answers.size !== 110) throw new Error(`Only ${answers.size} SQL answers are visible.`);
for (const [index, id] of ids.entries()) {
  if (answers.get(id) !== sqlAnswers[index]) throw new Error(`${id} differs from the MySQL source manifest.`);
}
if (sqlAnswers.some((answer) => /\b(?:ILIKE|FULL OUTER JOIN|STRING_AGG|ARRAY_AGG|GENERATE_SERIES|PERCENTILE_CONT|to_tsvector|DATE_TRUNC)\b|::|\$[12]\b/i.test(answer)))
  throw new Error('A PostgreSQL-only construct remains.');
console.log(JSON.stringify({result:'PASS',mysqlAnswers:answers.size}));
