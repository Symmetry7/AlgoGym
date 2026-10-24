import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((line) => {
      const index = line.indexOf("=");
      return index < 0
        ? []
        : [
            line.slice(0, index),
            line.slice(index + 1).replace(/^['\"]|['\"]$/g, ""),
          ];
    })
    .filter((pair) => pair.length === 2),
);
const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase QA configuration is missing.");
const client = createClient(url, key, { auth: { persistSession: false } });
const manifest = JSON.parse(readFileSync("docs/interview-editorial-manifest.json", "utf8"));
async function readAll(table, columns) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return rows;
  }
}
const [companies, questions, placements, categories] = await Promise.all([
  readAll("interview_companies", "slug,name"),
  readAll("interview_questions", "id,url,published"),
  readAll("interview_sheet_questions", "company_slug,question_id,position"),
  readAll("interview_category_questions", "category_slug,question_id"),
]);
assert.equal(companies.length, 45);
assert.ok(companies.every((company) => company.slug === "d-e-shaw" || existsSync(`public/company-icons/${company.slug}.png`)), "A company image is missing");
assert.ok(questions.length >= 200);
assert.ok(placements.length >= 3000);
const questionIds = new Set(questions.map((question) => question.id));
assert.ok(questions.every((question) => question.url.startsWith("https://")));
assert.ok(
  placements.every((placement) => questionIds.has(placement.question_id)),
);
const byCompany = new Map(
  companies.map((company) => [
    company.slug,
    placements
      .filter((entry) => entry.company_slug === company.slug)
      .sort((a, b) => a.position - b.position)
      .map((entry) => entry.question_id),
  ]),
);
for (const [slug, ids] of byCompany) {
  assert.ok(ids.length >= 35 && new Set(ids).size === ids.length, `Invalid ${slug} track`);
  assert.deepEqual(ids, manifest.companyTracks[slug]?.questionIds, `Unexpected ${slug} membership or order`);
}
assert.equal(new Set([...byCompany.values()].map((ids) => ids.join(","))).size, companies.length, "Duplicate full company sheet");
assert.notDeepEqual(byCompany.get("google")?.slice(0, 5), byCompany.get("amazon")?.slice(0, 5));
for (const [category, minimum] of [
  ["package-wise", 200],
  ["patterns", 165],
  ["sql", 105],
  ["system-design", 10],
  ["hr-questions", 10],
  ["interview-questions", 8],
]) {
  assert.ok(
    categories.filter((item) => item.category_slug === category).length >=
      minimum,
    `Missing ${category} questions`,
  );
}
assert.equal(categories.filter((item) => item.category_slug === "patterns").length, new Set(Object.values(manifest.patterns).flat()).size);
console.log(
  `PASS: ${companies.length} companies, ${questions.length} canonical questions, ${placements.length} valid editorial placements, distinct company tracks, and audited category assignments.`,
);
