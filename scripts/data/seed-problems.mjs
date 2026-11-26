// Seeds content/problems into Postgres: catalog_problems, problem_languages, test_cases, hints, editorials, tags
// (from topics) and patterns. Idempotent: it diffs against what is stored and writes only the differences, so a
// second run reports 0 changes. Problems removed from content are reported, never deleted.
// Usage (from the repo root):
//   node scripts/data/seed-problems.mjs [--env .env.staging.local] [--include-drafts] [--dry-run] [folder...]
// Only `ready` problems are seeded unless --include-drafts (staging/dev). Refuses the production project unless --production.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { LANGUAGES, SOLUTION_FILE } from "../../packages/judge/src/index.mjs";
import { listFolders, loadProblem } from "../lib/problems.mjs";

const PRODUCTION_REF = "sfnmcgcxerbqceujzbqv";
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const envFile = argv.includes("--env") ? argv[argv.indexOf("--env") + 1] : ".env.staging.local";
const only = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--env");

const env = parseEnv(readFileSync(envFile, "utf8"));
const url = env.STAGING_SUPABASE_URL ?? env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.STAGING_SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error(`${envFile} needs a Supabase URL and service-role key`);
if (url.includes(PRODUCTION_REF) && !flag("--production")) throw new Error("Refusing to seed production without --production");
const db = createClient(url, key, { auth: { persistSession: false } });
console.log(`Seeding ${new URL(url).hostname.split(".")[0]}${flag("--dry-run") ? " (dry run)" : ""}`);

// Stable JSON for comparing stored jsonb (Postgres reorders object keys) with local values.
const canon = (v) => JSON.stringify(v, (_, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
const titleCase = (slug) => slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data; };

// "1. first\n2. second" -> ["first", "second"] (an item may span lines).
const parseHints = (md) => (md ?? "").split(/^\d+\.\s+/m).map((s) => s.trim()).filter(Boolean);

const counts = { insert: 0, update: 0, delete: 0 };
// Bring `table` rows matching `scope` in line with `want`, keyed by `keyCols`.
async function sync(table, scope, keyCols, want) {
  if (Object.values(scope).some((v) => Array.isArray(v) && !v.length)) return;
  const have = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select("*").range(from, from + 999);
    for (const [col, val] of Object.entries(scope)) q = Array.isArray(val) ? q.in(col, val) : q.eq(col, val);
    const page = must(await q, `read ${table}`);
    have.push(...page);
    if (page.length < 1000) break;
  }
  const k = (r) => keyCols.map((c) => r[c]).join("|");
  const byKey = new Map(have.map((r) => [k(r), r]));
  const inserts = [], updates = [];
  for (const row of want) {
    const old = byKey.get(k(row));
    byKey.delete(k(row));
    if (!old) inserts.push(row);
    else if (Object.keys(row).some((c) => canon(row[c]) !== canon(old[c]))) updates.push(row);
  }
  const deletes = [...byKey.values()];
  counts.insert += inserts.length; counts.update += updates.length; counts.delete += deletes.length;
  if (flag("--dry-run")) return;
  for (let i = 0; i < inserts.length + updates.length; i += 200) {
    must(await db.from(table).upsert([...inserts, ...updates].slice(i, i + 200), { onConflict: keyCols.join(",") }), `write ${table}`);
  }
  for (const row of deletes) {
    let q = db.from(table).delete();
    for (const c of keyCols) q = q.eq(c, row[c]);
    must(await q, `delete ${table}`);
  }
  if (inserts.length + updates.length + deletes.length) console.log(`  ${table}: +${inserts.length} ~${updates.length} -${deletes.length}`);
}

const problems = listFolders()
  .filter((f) => f !== "_template" && (!only.length || only.includes(f)))
  .map(loadProblem)
  .filter((p) => p.meta.status === "ready" || (flag("--include-drafts") && ["draft", "review"].includes(p.meta.status)));
if (!problems.length) { console.log("Nothing to seed (only `ready` problems are seeded; pass --include-drafts for staging)."); process.exit(0); }

// Tags (from topics) and patterns, by slug.
const tagSlugs = [...new Set(problems.flatMap((p) => p.meta.topics))].sort();
const patternSlugs = [...new Set(problems.flatMap((p) => p.meta.patterns))].sort();
await sync("tags", { slug: tagSlugs }, ["slug"], tagSlugs.map((slug) => ({ slug, name: titleCase(slug) })));
await sync("patterns", { slug: patternSlugs }, ["slug"], patternSlugs.map((slug) => ({ slug, name: titleCase(slug) })));

await sync("catalog_problems", { slug: problems.map((p) => p.meta.slug) }, ["slug"], problems.map(({ meta, statement }) => ({
  slug: meta.slug, title: meta.title, difficulty: meta.difficulty, category: meta.category, statement_md: statement,
  signature: meta.signature, source: "algogym", status: "original", pool: meta.pool, is_pro: meta.is_pro, comparator: meta.comparator,
})));
const idOf = new Map(must(await db.from("catalog_problems").select("id, slug").in("slug", problems.map((p) => p.meta.slug)), "read ids").map((r) => [r.slug, r.id]));
const tagId = new Map(must(await db.from("tags").select("id, slug").in("slug", tagSlugs), "read tags").map((r) => [r.slug, r.id]));
const patternId = new Map(patternSlugs.length ? must(await db.from("patterns").select("id, slug").in("slug", patternSlugs), "read patterns").map((r) => [r.slug, r.id]) : []);

for (const p of problems) {
  const problem_id = idOf.get(p.meta.slug);
  if (!problem_id) { if (flag("--dry-run")) { console.log(`  ${p.meta.slug}: new (children counted on the real run)`); continue; } throw new Error(`no id for ${p.meta.slug}`); }
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
}

const stored = must(await db.from("catalog_problems").select("slug").eq("source", "algogym"), "read catalog");
const orphans = stored.map((r) => r.slug).filter((s) => !listFolders().includes(s));
if (orphans.length) console.log(`In the database but not in content (left alone): ${orphans.join(", ")}`);
const total = counts.insert + counts.update + counts.delete;
console.log(`${problems.length} problems: ${counts.insert} inserted, ${counts.update} updated, ${counts.delete} deleted${total ? "" : " (no changes)"}`);
