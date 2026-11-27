// Seeds content/problems into Postgres: catalog_problems, problem_languages, test_cases, hints, editorials, tags
// (from topics) and patterns. Idempotent: it diffs against what is stored and writes only the differences, so a
// second run reports 0 changes. Problems removed from content are reported, never deleted.
// Usage (from the repo root):
//   node scripts/data/seed-problems.mjs [--env .env.staging.local] [--include-drafts] [--dry-run] [folder...]
// Only `ready` problems are seeded unless --include-drafts (staging/dev). Refuses the production project unless --production.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LANGUAGES, SOLUTION_FILE } from "../../packages/judge/src/index.mjs";
import { connect, makeSync, must, readAll, summary } from "../lib/db-sync.mjs";
import { listFolders, loadProblem } from "../lib/problems.mjs";

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const only = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--env");
const { db, dryRun } = connect(argv, "seeding");
const { sync, counts } = makeSync(db, { dryRun });

const titleCase = (slug) => slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
// "1. first\n2. second" -> ["first", "second"] (an item may span lines).
const parseHints = (md) => (md ?? "").split(/^\d+\.\s+/m).map((s) => s.trim()).filter(Boolean);

const problems = listFolders()
  .filter((f) => f !== "_template" && (!only.length || only.includes(f)))
  .map(loadProblem)
  .filter((p) => p.meta.status === "ready" || (flag("--include-drafts") && ["draft", "review"].includes(p.meta.status)));
if (!problems.length) { console.log("Nothing to seed (only `ready` problems are seeded; pass --include-drafts for staging)."); process.exit(0); }

// Tags (from topics) and patterns, by slug.
const tagSlugs = [...new Set(problems.flatMap((p) => p.meta.topics))].sort();
const patternSlugs = [...new Set(problems.flatMap((p) => p.meta.patterns))].sort();
// A topic with a lesson takes the lesson title ("Arrays & Strings"); others are title-cased from the slug.
const lessonTitles = Object.fromEntries(readdirSync("content/learn", { withFileTypes: true }).filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join("content/learn", d.name)).filter((f) => f.endsWith(".mdx") && !f.startsWith("_")).map((f) => readFileSync(join("content/learn", d.name, f), "utf8")))
  .map((text) => [text.match(/^topic:\s*(\S+)/m)?.[1], text.match(/^title:\s*(.+)$/m)?.[1].trim()]).filter(([t, n]) => t && n));
await sync("tags", { slug: tagSlugs }, ["slug"], tagSlugs.map((slug) => ({ slug, name: lessonTitles[slug] ?? titleCase(slug) })));
await sync("patterns", { slug: patternSlugs }, ["slug"], patternSlugs.map((slug) => ({ slug, name: titleCase(slug) })));

await sync("catalog_problems", { slug: problems.map((p) => p.meta.slug) }, ["slug"], problems.map(({ meta, statement }) => ({
  slug: meta.slug, title: meta.title, difficulty: meta.difficulty, category: meta.category, statement_md: statement,
  signature: meta.signature, source: "algogym", status: "original", pool: meta.pool, is_pro: meta.is_pro, comparator: meta.comparator,
})));
const idOf = new Map(must(await db.from("catalog_problems").select("id, slug").in("slug", problems.map((p) => p.meta.slug)), "read ids").map((r) => [r.slug, r.id]));
const tagId = new Map(must(await db.from("tags").select("id, slug").in("slug", tagSlugs), "read tags").map((r) => [r.slug, r.id]));
const patternId = new Map(patternSlugs.length ? must(await db.from("patterns").select("id, slug").in("slug", patternSlugs), "read patterns").map((r) => [r.slug, r.id]) : []);

// "leetcode:739" -> the imported metadata row for that problem (M7), via data/leetcode/numbers.json.
const lcSlugs = JSON.parse(readFileSync("data/leetcode/numbers.json", "utf8")).slugs;
const refs = problems.flatMap((p) => p.meta.similar_to ?? []);
const missingNumbers = refs.filter((r) => r.startsWith("leetcode:") && !lcSlugs[r.slice(9)]);
if (missingNumbers.length) throw new Error(`Add these to data/leetcode/numbers.json: ${[...new Set(missingNumbers)].join(", ")}`);
const lcRows = await readAll(db, "catalog_problems", { source: "leetcode", source_ref: [...new Set(refs.filter((r) => r.startsWith("leetcode:")).map((r) => lcSlugs[r.slice(9)]))] }, "id, source_ref", ["source_ref"]);
const lcId = new Map(lcRows.map((r) => [r.source_ref, r.id]));
const unlinked = new Set();
const similarIds = (p) => [...new Set((p.meta.similar_to ?? []).flatMap((r) => {
  const id = r.startsWith("leetcode:") ? lcId.get(lcSlugs[r.slice(9)]) : undefined;
  if (!id) unlinked.add(r);
  return id ? [id] : [];
}))];

for (const p of problems) {
  const problem_id = idOf.get(p.meta.slug);
  if (!problem_id) { if (dryRun) { console.log(`  ${p.meta.slug}: new (children counted on the real run)`); continue; } throw new Error(`no id for ${p.meta.slug}`); }
  const { limits } = p.meta;
  await sync("problem_languages", { problem_id }, ["problem_id", "lang"], LANGUAGES.map((lang) => ({
    problem_id, lang, starter_code: p.starters[lang], harness_code: p.harnesses[lang],
    time_limit_ms: limits.time_ms_per_case, max_total_ms: limits.max_total_ms, memory_kb: limits.memory_mb * 1024,
  })));
  await sync("test_cases", { problem_id }, ["problem_id", "position"], p.cases.map((c, i) => ({
    problem_id, position: i + 1, input: c.args, expected_output: c.expected, is_hidden: c.set === "hidden", explain_md: c.explain ?? null,
  })));
  await sync("hints", { problem_id }, ["problem_id", "position"], parseHints(p.hints).map((body_md, i) => ({ problem_id, position: i + 1, body_md })));
  await sync("editorials", { problem_id }, ["problem_id"], [{
    problem_id, body_md: p.editorial, solutions: Object.fromEntries(LANGUAGES.map((l) => [l, { file: SOLUTION_FILE[l], code: p.solutions[l] }])),
  }]);
  await sync("problem_tags", { problem_id }, ["problem_id", "tag_id"], p.meta.topics.map((t) => ({ problem_id, tag_id: tagId.get(t) })));
  await sync("problem_patterns", { problem_id }, ["problem_id", "pattern_id"], p.meta.patterns.map((t) => ({ problem_id, pattern_id: patternId.get(t) })));
  await sync("problem_similar", { original_id: problem_id }, ["original_id", "similar_id"], similarIds(p).map((similar_id) => ({ original_id: problem_id, similar_id })));
}
if (unlinked.size) console.log(`similar_to not in the catalog yet (not in the imported company lists): ${[...unlinked].join(", ")}`);

const stored = must(await db.from("catalog_problems").select("slug").eq("source", "algogym"), "read catalog");
const orphans = stored.map((r) => r.slug).filter((s) => !listFolders().includes(s));
if (orphans.length) console.log(`In the database but not in content (left alone): ${orphans.join(", ")}`);
console.log(summary(counts, `${problems.length} problems`));
