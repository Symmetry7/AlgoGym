import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const roles = JSON.parse(readFileSync('data/interview-role-reference.json', 'utf8')).roles;
const response = await fetch('https://algogym.vercel.app/api/interview?mode=questions', { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`Cannot read canonical question IDs: ${response.status}`);
const existing = (await response.json()).questions ?? [];
const byTitle = new Map(existing.map((item) => [item.title.trim().toLowerCase(), item.id]));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const canonical = new Map();
const placements = [];
for (const role of roles) for (const question of role.questions) {
  const normalized = question.title.trim().toLowerCase();
  const id = byTitle.get(normalized) ?? `role-${createHash('sha256').update(normalized).digest('hex').slice(0, 24)}`;
  if (!canonical.has(id)) canonical.set(id, { id, title: question.title, difficulty: question.difficulty, category: question.category, url: role.sourceUrl });
  placements.push({ role: role.slug, id, position: question.index - 1 });
}
if (roles.length !== 20 || placements.length !== 8098) throw new Error(`Unexpected role inventory ${roles.length}/${placements.length}`);
const newQuestions = [...canonical.values()].filter((item) => !existing.some((question) => question.id === item.id));
const questionRows = newQuestions.map((item) => `(${[item.id,item.title,'Role prompt',item.url].map(quote).join(',')},${item.difficulty ? quote(item.difficulty) : 'null'},array[${quote('Role interview')},${quote(item.category ?? 'Practice')}])`);
const roleRows = roles.map((role, index) => `(${[role.slug,role.group,role.title,role.sourceUrl].map(quote).join(',')},${role.questions.length},${index})`);
const placementRows = placements.map((entry) => `(${quote(entry.role)},${quote(entry.id)},${entry.position})`);
const migration = `-- Public role-question titles and difficulty labels only; answer text is not copied.
-- Stable canonical IDs allow the same prompt across roles to share saved progress.
insert into public.interview_questions(id,title,source,url,difficulty,tags) values
${questionRows.join(',\n')}
on conflict (id) do nothing;

create table if not exists public.interview_roles (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,80}$'),
  group_name text not null,
  title text not null,
  source_url text not null check (source_url ~ '^https://'),
  question_count integer not null check (question_count >= 0),
  position integer not null
);
create table if not exists public.interview_role_questions (
  role_slug text not null references public.interview_roles(slug) on delete cascade,
  question_id text not null references public.interview_questions(id) on delete restrict,
  position integer not null check (position >= 0),
  primary key(role_slug,position)
);
create index if not exists interview_roles_group_idx on public.interview_roles(group_name,position);
alter table public.interview_roles enable row level security;
alter table public.interview_role_questions enable row level security;
create policy interview_roles_read on public.interview_roles for select to anon,authenticated using (true);
create policy interview_role_questions_read on public.interview_role_questions for select to anon,authenticated using (true);
grant select on public.interview_roles,public.interview_role_questions to anon,authenticated;
insert into public.interview_roles(slug,group_name,title,source_url,question_count,position) values
${roleRows.join(',\n')}
on conflict (slug) do update set group_name=excluded.group_name,title=excluded.title,source_url=excluded.source_url,question_count=excluded.question_count,position=excluded.position;
insert into public.interview_role_questions(role_slug,question_id,position) values
${placementRows.join(',\n')}
on conflict (role_slug,position) do update set question_id=excluded.question_id;
`;
writeFileSync('supabase/migrations/20261024231500_interview_role_sheets.sql', migration);
console.log(JSON.stringify({ roles:roles.length, placements:placements.length, uniquePrompts:canonical.size, newCanonical:newQuestions.length, reusedCanonical:canonical.size-newQuestions.length }));
