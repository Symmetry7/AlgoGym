import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

// Import only public factual metadata (title, slug, difficulty, link).
// Do not copy LeetCode statements, hints, solutions, or private content.
const response = await fetch("https://leetcode.com/api/problems/database/", {
  headers: { "User-Agent": "AlgoGym public catalog audit (inseailabs@gmail.com)" },
});
if (!response.ok) throw new Error(`LeetCode catalog returned ${response.status}`);
const catalog = await response.json();
assert.ok(Array.isArray(catalog.stat_status_pairs));
const problems = catalog.stat_status_pairs
  .filter((entry) => !entry.paid_only && entry.stat?.question__title_slug && entry.stat?.question__title)
  .map((entry) => ({
    number: Number(entry.stat.frontend_question_id),
    slug: entry.stat.question__title_slug,
    title: entry.stat.question__title,
    difficulty: ({ 1: "Easy", 2: "Medium", 3: "Hard" })[entry.difficulty?.level],
  }))
  .filter((entry) => Number.isFinite(entry.number) && entry.difficulty)
  .sort((a, b) => a.number - b.number);
const counts = Object.fromEntries(["Easy", "Medium", "Hard"].map((level) => [level, problems.filter((p) => p.difficulty === level).length]));
console.log(JSON.stringify({ total: problems.length, counts }));
if (!process.argv.includes("--write")) process.exit(0);

const existing = readFileSync("supabase/migrations/20261022231202_interview_category_questions.sql", "utf8");
const existingIds = new Map([...existing.matchAll(/\('([^']+)','[^']+','LeetCode','https:\/\/leetcode\.com\/problems\/([^/]+)\//g)].map((match) => [match[2], match[1]]));
const selected = problems;
assert.ok(selected.length >= 100, "Public free SQL catalog unexpectedly small");
const rows = selected.map((problem) => ({ ...problem, id: existingIds.get(problem.slug) ?? `sql-${problem.slug}` }));
assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
const esc = (value) => String(value).replaceAll("'", "''");
const sql = [
  "-- Public LeetCode Database problem metadata observed 2026-10-24; no copied statements or Hynts compilation.",
  "-- Existing canonical progress/bookmarks are retained for previously indexed SQL problems.",
  "insert into public.interview_questions(id,title,source,url,difficulty,tags) values",
  rows.map((row) => `('${esc(row.id)}','${esc(row.title)}','LeetCode','https://leetcode.com/problems/${esc(row.slug)}/','${row.difficulty}',array['SQL','Database'])`).join(",\n") + "\non conflict(id) do nothing;",
  "delete from public.interview_category_questions where category_slug='sql';",
  "insert into public.interview_category_questions(category_slug,question_id,position) values",
  rows.map((row, index) => `('sql','${esc(row.id)}',${index})`).join(",\n") + ";",
].join("\n");
writeFileSync("supabase/migrations/20261024193000_interview_sql_public_catalog.sql", sql + "\n");
writeFileSync("docs/interview-sql-public-manifest.json", JSON.stringify({ observedAt: "2026-10-24", source: "https://leetcode.com/api/problems/database/", selected: rows }, null, 2) + "\n");
console.log(`Wrote ${rows.length} distinct free SQL exercises.`);
