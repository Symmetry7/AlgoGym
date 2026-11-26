// Ranks companies in a local clone of liquidslr/leetcode-company-wise-problems by how many distinct
// questions are reported for them, and writes the top N to data/companies/top-<N>.json.
// Metadata only: company names, slugs and question counts per timeframe. No problem text is read or stored.
// Usage (from the repo root): node scripts/data/top-companies.mjs <path-to-clone> [N=30]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const source = process.argv[2];
const topN = Number(process.argv[3] ?? 30);
if (!source || !existsSync(source)) throw new Error("Pass the path to a clone of liquidslr/leetcode-company-wise-problems.");

const files = { thirtyDays: "1. Thirty Days.csv", threeMonths: "2. Three Months.csv", sixMonths: "3. Six Months.csv", all: "5. All.csv" };
// Count distinct problem links (column 5) so duplicate rows don't inflate a company.
const distinctLinks = (path) => {
  if (!existsSync(path)) return 0;
  const lines = readFileSync(path, "utf8").split(/\r?\n/).slice(1).filter(Boolean);
  return new Set(lines.map((line) => line.match(/https:\/\/leetcode\.com\/problems\/[^,"]+/)?.[0]).filter(Boolean)).size;
};
const slugify = (name) => name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const companies = readdirSync(source)
  .filter((name) => !name.startsWith(".") && statSync(join(source, name)).isDirectory())
  .map((name) => ({
    name,
    slug: slugify(name),
    questions: Object.fromEntries(Object.entries(files).map(([key, file]) => [key, distinctLinks(join(source, name, file))])),
  }))
  .sort((a, b) => b.questions.all - a.questions.all || a.name.localeCompare(b.name));

const commit = execFileSync("git", ["-C", source, "log", "-1", "--format=%H %cs"], { encoding: "utf8" }).trim().split(" ");
const out = {
  source: "https://github.com/liquidslr/leetcode-company-wise-problems",
  sourceCommit: commit[0],
  sourceDate: commit[1],
  license: "None stated by the source repository: company names and counts only (docs/PRD.md §8).",
  rankedBy: "Distinct questions in the company's 'All' list",
  companiesInSource: companies.length,
  top: companies.slice(0, topN).map((c, i) => ({ rank: i + 1, ...c })),
};
mkdirSync("data/companies", { recursive: true });
writeFileSync(`data/companies/top-${topN}.json`, JSON.stringify(out, null, 2) + "\n");
console.log(`${companies.length} companies; wrote data/companies/top-${topN}.json`);
for (const c of out.top) console.log(String(c.rank).padStart(2), c.name.padEnd(28), c.questions.all, "all /", c.questions.sixMonths, "6 mo /", c.questions.thirtyDays, "30 d");
