import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const reference = JSON.parse(readFileSync('docs/hynts-public-company-titles.json', 'utf8'));
const existing = new Map();
const byTitle = new Map();
const row = /\('(lc-[^']+)','((?:''|[^'])*)','LeetCode','(https:\/\/[^']+)','(Easy|Medium|Hard)',array\[(.*?)\](?:::text\[\])?\)/gs;
for (const name of readdirSync('supabase/migrations').filter((x) => x.endsWith('.sql')).sort()) {
  const sql = readFileSync(`supabase/migrations/${name}`, 'utf8');
  for (const match of sql.matchAll(row)) {
    const [, id, rawTitle, url, difficulty, rawTags] = match;
    const title = rawTitle.replaceAll("''", "'");
    if (existing.has(id)) continue;
    const tags = [...rawTags.matchAll(/'((?:''|[^'])*)'/g)].map((tag) => tag[1].replaceAll("''", "'"));
    const value = { id, title, url, difficulty, tags, source: 'LeetCode' };
    existing.set(id, value);
    if (!byTitle.has(title.toLowerCase())) byTitle.set(title.toLowerCase(), value);
  }
}
const slugify = (title) => title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const variants = new Map();
for (const track of Object.values(reference)) for (const question of track.questions) {
  const list = variants.get(question.title) ?? [];
  list.push(question);
  variants.set(question.title, list);
}
const newQuestions = [];
const canonical = new Map();
const conflicts = [];
for (const [title, occurrences] of variants) {
  const urls = [...new Set(occurrences.map((q) => q.url))];
  if (urls.length > 1) conflicts.push({ title, urls });
  const preferred = occurrences.find((q) => q.url?.startsWith('https://leetcode.com/problems/')) ?? occurrences.find((q) => q.url?.startsWith('https://')) ?? occurrences[0];
  const url = preferred.url?.replace(/^hhttps:/, 'https:').replace(/^http:/, 'https:');
  if (!url || !/^https:\/\/[a-z0-9.-]+\//.test(url) || url.includes('hynts.in')) throw new Error(`Bad link for ${title}: ${url}`);
  const found = byTitle.get(title.toLowerCase());
  const id = found?.id ?? `${preferred.platform === 'LeetCode' ? 'lc' : 'gfg'}-${slugify(title)}`;
  if (id.length > 120) throw new Error(`ID too long: ${title}`);
  if (canonical.has(id) && canonical.get(id).title !== title) throw new Error(`ID collision: ${id}`);
  const source = url.includes('leetcode.com/') ? 'LeetCode' : url.includes('geeksforgeeks.org/') ? 'GeeksforGeeks' : 'Reference';
  const value = found ?? { id, title, url, difficulty: preferred.difficulty, tags: [], source };
  canonical.set(id, value);
  if (!found) newQuestions.push(value);
}
const placements = [];
const duplicatePlacements = [];
for (const [slug, track] of Object.entries(reference)) {
  const seen = new Set();
  for (const question of track.questions) {
    const id = [...canonical.values()].find((item) => item.title === question.title)?.id;
    if (!id) throw new Error(`Unmapped ${slug}: ${question.title}`);
    if (seen.has(id)) duplicatePlacements.push({ slug, title: question.title, position: question.position });
    seen.add(id);
    placements.push({ slug, id, position: question.position - 1, url: question.url.replace(/^hhttps:/, 'https:').replace(/^http:/, 'https:') });
  }
}
if (Object.keys(reference).length !== 45 || placements.length !== 2593) throw new Error(`Unexpected source inventory ${Object.keys(reference).length}/${placements.length}`);
const migration = [
  '-- Exact public company question title/order inventory observed on Hynts 2026-10-24.',
  '-- Official platform links are factual references; descriptions/popularity are not copied.',
  '-- Canonical question IDs and all user progress/bookmark rows are preserved.',
  'create schema if not exists private;',
  'create table if not exists private.interview_sheet_questions_before_reference_repair_20261024 as select * from public.interview_sheet_questions;',
  'revoke all on private.interview_sheet_questions_before_reference_repair_20261024 from anon, authenticated;',
  'alter table public.interview_sheet_questions add column if not exists source_url text check (source_url is null or source_url ~ \'^https://\');',
  'alter table public.interview_sheet_questions drop constraint if exists interview_sheet_questions_pkey;',
  'alter table public.interview_sheet_questions add constraint interview_sheet_questions_pkey primary key (company_slug, position);',
  newQuestions.length ? `insert into public.interview_questions(id,title,source,url,difficulty,tags) values\n${newQuestions.map((q) => `(${[q.id,q.title,q.source,q.url].map(quote).join(',')},${q.difficulty ? quote(q.difficulty) : 'null'},array[]::text[])`).join(',\n')}\non conflict (id) do nothing;` : '',
  `delete from public.interview_sheet_questions where company_slug in (${Object.keys(reference).map(quote).join(',')});`,
  `insert into public.interview_sheet_questions(company_slug,question_id,position,source_url) values\n${placements.map((p) => `(${quote(p.slug)},${quote(p.id)},${p.position},${quote(p.url)})`).join(',\n')};`,
].filter(Boolean).join('\n\n') + '\n';
writeFileSync('supabase/migrations/20261024210000_interview_reference_company_sheets.sql', migration);
writeFileSync('docs/interview-company-reference-map.json', JSON.stringify({ observedAt: '2026-10-24', companies: Object.fromEntries(Object.entries(reference).map(([slug, value]) => [slug, { sourceUrl: value.sourceUrl, questionIds: value.questions.map((q) => [...canonical.values()].find((item) => item.title === q.title).id), titles: value.questions.map((q) => q.title) }])), urlConflicts: conflicts, repeatedRows: duplicatePlacements }, null, 2) + '\n');
console.log(JSON.stringify({companies: Object.keys(reference).length, placements: placements.length, uniqueTitles: variants.size, reusedCanonical: canonical.size - newQuestions.length, addedCanonical: newQuestions.length, urlConflicts: conflicts.length, repeatedRows: duplicatePlacements}, null, 2));
