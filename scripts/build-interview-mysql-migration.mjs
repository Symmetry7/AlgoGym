import { writeFileSync } from 'node:fs';
import { sqlAnswers } from '../data/interview-original-answers.mjs';

const output = process.argv[2];
if (!output) throw new Error('Pass a new migration path.');
if (sqlAnswers.length !== 110) throw new Error(`Expected 110 SQL answers, found ${sqlAnswers.length}.`);

const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const rows = sqlAnswers.map((answer, index) =>
  `('sql-ref-${String(index + 1).padStart(3, '0')}', ${quote(answer)})`,
);

writeFileSync(output, `-- Convert the existing AlgoGym SQL examples to MySQL 8.0+.
-- Keep question identities and user progress intact.
insert into public.interview_question_content(question_id, answer_code)
values
${rows.join(',\n')}
on conflict(question_id) do update set answer_code = excluded.answer_code;
`);
console.log(`Wrote ${rows.length} MySQL answers to ${output}`);
