// Writes editorial tags onto interview_items from data/interview-tags.json (DECISIONS.md 2026-11-27):
//   roles     = "Useful for" (our judgement by SQL topic; HR items stay empty = every role)
//   companies = "Similar questions asked at": the real all-time company lists of matched LeetCode database problems.
// Idempotent: a second run reports 0 changes. Usage: node scripts/data/tag-interview-items.mjs [--env file] [--dry-run]
import { readFileSync } from "node:fs";
import { connect, makeSync, readAll, summary } from "../lib/db-sync.mjs";

const argv = process.argv.slice(2);
const tags = JSON.parse(readFileSync("data/interview-tags.json", "utf8"));
const { db, dryRun } = connect(argv, "tagging");
const { sync, counts } = makeSync(db, { dryRun });

const items = await readAll(db, "interview_items", { source_table: "interview_questions" }, "*", ["source_id"]);
const slugs = [...new Set(Object.values(tags.sqlSimilar).flat())];
const lc = await readAll(db, "catalog_problems", { source: "leetcode", source_ref: slugs }, "id, source_ref", ["source_ref"]);
const lcId = new Map(lc.map((r) => [r.source_ref, r.id]));
const missing = slugs.filter((s) => !lcId.has(s));
if (missing.length) console.log(`Not in the catalog (skipped): ${missing.join(", ")}`);

const companies = await readAll(db, "companies", {}, "id, slug", ["slug"]);
const companySlug = new Map(companies.map((c) => [c.id, c.slug]));
const links = lc.length ? await readAll(db, "problem_companies", { problem_id: [...lcId.values()], timeframe: "all" }, "problem_id, company_id, frequency", ["problem_id", "company_id"]) : [];
const companiesOf = new Map();
for (const l of links) companiesOf.set(l.problem_id, [...(companiesOf.get(l.problem_id) ?? []), { slug: companySlug.get(l.company_id), f: Number(l.frequency) }]);

const rolesFor = (item) => {
  if (item.kind !== "sql") return [];
  const byTag = item.tags.map((t) => tags.rolesBySqlTag[t]).find(Boolean);
  return [...(byTag ?? tags.rolesBySqlTag.default)].sort();
};
const companiesFor = (item) => {
  if (item.kind !== "sql") return [];
  const best = new Map(); // company -> highest frequency across matched problems
  for (const slug of tags.sqlSimilar[item.source_id] ?? []) {
    for (const c of companiesOf.get(lcId.get(slug)) ?? []) if (c.slug) best.set(c.slug, Math.max(best.get(c.slug) ?? 0, c.f));
  }
  return [...best].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([s]) => s); // most frequent first
};

await sync("interview_items", { source_table: "interview_questions" }, ["source_table", "source_id"],
  items.map((i) => ({ ...i, roles: rolesFor(i), companies: companiesFor(i) })), { keep: true });
const tagged = items.filter((i) => companiesFor(i).length).length;
console.log(`${items.length} items; ${tagged} SQL items linked to companies via LeetCode matches`);
console.log(summary(counts, "interview_items"));
