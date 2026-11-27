// M7: imports company-wise LeetCode metadata for the companies in data/companies/top-30.json from a local clone of
// liquidslr/leetcode-company-wise-problems (pinned commit in that file) into companies, catalog_problems and
// problem_companies. METADATA ONLY: title, difficulty, link and per-company frequency. No statement text is stored;
// LeetCode rows are source=leetcode, status=pending (docs/DECISIONS.md 2026-11-24). Idempotent: a second run reports
// 0 changes. LeetCode rows are never deleted (users may bookmark them later); company links are refreshed.
// Usage (from the repo root): node scripts/data/import-companies.mjs <path-to-clone> [--env .env.staging.local] [--dry-run]
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { connect, makeSync, readAll, summary } from "../lib/db-sync.mjs";

const argv = process.argv.slice(2);
const clone = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--env");
if (!clone || !existsSync(clone)) throw new Error("Pass the path to a clone of liquidslr/leetcode-company-wise-problems.");

const top = JSON.parse(readFileSync("data/companies/top-30.json", "utf8"));
const head = execFileSync("git", ["-C", clone, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (head !== top.sourceCommit) throw new Error(`Clone is at ${head}; top-30.json was built from ${top.sourceCommit}. Check out that commit.`);

// Timeframes the schema has (30/60/90/all). The source has 30 days, 3 months, 6 months and all; 6 months has no slot.
const FILES = { "30": "1. Thirty Days.csv", "90": "2. Three Months.csv", all: "5. All.csv" };

// RFC 4180-style line split: quoted fields may hold commas and doubled quotes.
function splitCsvLine(line) {
  const out = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
assert.deepEqual(splitCsvLine('MEDIUM,"Pow(x, n)",61.2,0.3,https://leetcode.com/problems/powx-n,"Math, Recursion"'),
  ["MEDIUM", "Pow(x, n)", "61.2", "0.3", "https://leetcode.com/problems/powx-n", "Math, Recursion"]);
assert.deepEqual(splitCsvLine('EASY,"Say ""hi""",1,0,x,'), ["EASY", 'Say "hi"', "1", "0", "x", ""]);

const DIFFICULTY = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };
function readCompanyFile(path) {
  if (!existsSync(path)) return [];
  const [header, ...lines] = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  // Some files lack the trailing Topics column; only the first five are read.
  assert.ok(header.trim().startsWith("Difficulty,Title,Frequency,Acceptance Rate,Link"), `unexpected columns in ${path}`);
  return lines.map(splitCsvLine).flatMap(([difficulty, title, frequency, , link]) => {
    const ref = link?.match(/^https:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\/?$/)?.[1];
    if (!ref || !DIFFICULTY[difficulty] || !title) return []; // skip malformed rows rather than store guesses
    return [{ ref, title: title.trim(), difficulty: DIFFICULTY[difficulty], frequency: Number(frequency) || 0 }];
  });
}

const problems = new Map(); // ref -> { title, difficulty }
const links = []; // { company, ref, timeframe, frequency }
for (const c of top.top) {
  for (const [timeframe, file] of Object.entries(FILES)) {
    const seen = new Set();
    for (const row of readCompanyFile(join(clone, c.name, file))) {
      if (seen.has(row.ref)) continue; // duplicate rows in a file: keep the first
      seen.add(row.ref);
      problems.set(row.ref, { title: row.title, difficulty: row.difficulty });
      links.push({ company: c.slug, ref: row.ref, timeframe, frequency: row.frequency });
    }
  }
}
console.log(`Source ${head.slice(0, 7)}: ${top.top.length} companies, ${problems.size} LeetCode problems, ${links.length} company links`);

const { db, dryRun } = connect(argv, "importing into");
const { sync, counts } = makeSync(db, { dryRun });

await sync("companies", { slug: top.top.map((c) => c.slug) }, ["slug"], top.top.map((c) => ({ slug: c.slug, name: c.name })));
await sync("catalog_problems", { source: "leetcode" }, ["slug"], [...problems].map(([ref, p]) => ({
  slug: `lc-${ref}`, title: p.title, difficulty: p.difficulty, category: "dsa", source: "leetcode", source_ref: ref,
  source_url: `https://leetcode.com/problems/${ref}/`, status: "pending", pool: "public", is_pro: false, comparator: "exact",
})), { keep: true });

if (dryRun) { console.log(summary(counts, "Dry run (company links are counted on the real run)")); process.exit(0); }
const companyId = new Map((await readAll(db, "companies", { slug: top.top.map((c) => c.slug) }, "id, slug", ["slug"])).map((r) => [r.slug, r.id]));
const problemId = new Map((await readAll(db, "catalog_problems", { source: "leetcode" }, "id, source_ref", ["slug"])).map((r) => [r.source_ref, r.id]));
const missing = links.filter((l) => !problemId.has(l.ref));
if (missing.length) throw new Error(`${missing.length} links point at problems that were not stored`);
await sync("problem_companies", { company_id: [...companyId.values()] }, ["problem_id", "company_id", "timeframe"], links.map((l) => ({
  problem_id: problemId.get(l.ref), company_id: companyId.get(l.company), timeframe: l.timeframe, frequency: l.frequency,
})));
console.log(summary(counts, `${top.top.length} companies`));
