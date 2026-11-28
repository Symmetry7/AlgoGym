// Imports data/hynts-catalog.json (scripts/data/fetch-hynts.py) into staging, metadata only (DECISIONS.md 2026-11-28):
//   companies          hynts.in companies we don't list yet (name and slug)
//   catalog_problems   lc-/gfg- metadata rows for company-sheet questions with no row yet (pending, no statement, no link)
//   problem_companies  all-time links for company-sheet questions not linked yet (frequency 0: the source gives none)
//   interview_sheets, interview_catalog   every sheet and question, with tracks, the matching catalog problem, the Algogym
//                      original to practise it with, and the Algogym HR/SQL answer when there is one
// Existing companies, problems and links are never changed or deleted. Diff-then-write: a second run reports 0 changes.
// Usage: node scripts/data/import-hynts.mjs [--env file] [--dry-run]   (reads .env.staging.local; refuses production)
import { readFileSync } from "node:fs";
import { connect, makeSync, readAll, summary } from "../lib/db-sync.mjs";
import { TRACKS, plan } from "../lib/hynts.mjs";

const argv = process.argv.slice(2);
const catalog = JSON.parse(readFileSync("data/hynts-catalog.json", "utf8"));
const { db, dryRun } = connect(argv, "importing Hynts metadata into");
const { sync, counts } = makeSync(db, { dryRun });

// Our sheet names and groups for roles and topic sheets, from the earlier reference files.
const names = new Map([
  ...JSON.parse(readFileSync("data/interview-role-reference.json", "utf8")).roles.map((r) => [`role:${r.slug}`, { title: r.title, group: r.group }]),
  ...JSON.parse(readFileSync("data/interview-technical-reference.json", "utf8")).sheets.map((s) => [`topic:${s.slug}`, { title: s.title, group: s.group }]),
]);

async function load() {
  const [problems, similar, items, companies] = await Promise.all([
    readAll(db, "catalog_problems", {}, "id, slug, title, source, source_ref, difficulty", ["slug"]),
    readAll(db, "problem_similar", {}, "original_id, similar_id", ["original_id", "similar_id"]),
    readAll(db, "interview_items", {}, "id, question", ["id"]),
    readAll(db, "companies", {}, "id, slug, name", ["slug"]),
  ]);
  return plan(catalog, { problems, similar, items, companies, names });
}

// 1. Companies and catalog problems that later rows need ids for. Scoped to the slugs this import owns, never deleted.
const first = await load();
await sync("companies", { slug: first.companies.map((c) => c.slug) }, ["slug"], first.companies, { keep: true });
const newSlugs = first.newProblems.map((p) => p.slug);
for (let i = 0; i < newSlugs.length; i += 200) {
  await sync("catalog_problems", { slug: newSlugs.slice(i, i + 200) }, ["slug"], first.newProblems.slice(i, i + 200), { keep: true });
}

// 2. With those ids in place (a dry run plans against what exists, so it undercounts links on a first run).
const final = dryRun ? first : await load();
const byProblem = new Map();
for (const l of final.links) byProblem.set(l.problem_id, [...(byProblem.get(l.problem_id) ?? []), l]);
const ids = [...byProblem.keys()].sort();
for (let i = 0; i < ids.length; i += 150) {
  const chunk = ids.slice(i, i + 150);
  // Only key columns are compared, so existing links (and their frequencies) are left exactly as they are.
  await sync("problem_companies", { problem_id: chunk, timeframe: "all" }, ["problem_id", "company_id", "timeframe"], chunk.flatMap((id) => byProblem.get(id)), { keep: true });
}
await sync("interview_sheets", {}, ["section", "slug"], final.sheets);
await sync("interview_catalog", {}, ["source_key"], final.rows);

// Counts per sheet section and per track: playable = an Algogym original to practise it with; answered = an Algogym HR/SQL answer.
const tally = (pick) => {
  const t = {};
  for (const r of final.rows) for (const k of pick(r)) {
    const c = (t[k] ??= { total: 0, playable: 0, answered: 0, metadataOnly: 0 });
    c.total++;
    if (r.practice_problem_id) c.playable++;
    else if (r.interview_item_id) c.answered++;
    else c.metadataOnly++;
  }
  return t;
};
console.log(`${final.sheets.length} sheets, ${final.rows.length} questions; ${first.newProblems.length} new catalog problems, ${final.links.length} company links planned`);
console.log("By section:"); console.table(tally((r) => [r.section]));
console.log("By track:"); console.table(Object.fromEntries(Object.entries(tally((r) => r.tracks)).sort(([a], [b]) => TRACKS.indexOf(a) - TRACKS.indexOf(b))));
console.log(summary(counts, "Hynts import"));
