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
const reference = JSON.parse(readFileSync("docs/interview-company-reference-map.json", "utf8"));
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
  readAll("interview_questions", "id,title,url,published"),
  readAll("interview_sheet_questions", "company_slug,question_id,position,source_url"),
  readAll("interview_category_questions", "category_slug,question_id"),
]);
assert.equal(companies.length, 45);
assert.ok(companies.every((company) => company.slug === "d-e-shaw" || existsSync(`public/company-icons/${company.slug}.png`)), "A company image is missing");
assert.ok(questions.length >= 389);
assert.equal(placements.length, Object.values(reference.companies).reduce((sum, company) => sum + company.questionIds.length, 0));
const questionIds = new Set(questions.map((question) => question.id));
const questionById = new Map(questions.map((question) => [question.id, question]));
const publicReference = JSON.parse(readFileSync("docs/hynts-public-company-titles.json", "utf8"));
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
  assert.ok(ids.length >= 50, `Invalid ${slug} track`);
  assert.deepEqual(ids, reference.companies[slug]?.questionIds, `Unexpected ${slug} membership or order`);
  const orderedRows = placements.filter((entry) => entry.company_slug === slug).sort((a, b) => a.position - b.position);
  assert.deepEqual(orderedRows.map((entry) => questionById.get(entry.question_id)?.title), publicReference[slug].questions.map((question) => question.title), `Wrong public titles for ${slug}`);
  assert.deepEqual(orderedRows.map((entry) => entry.source_url), publicReference[slug].questions.map((question) => question.url.replace(/^hhttps:/, "https:").replace(/^http:/, "https:")), `Wrong source URLs for ${slug}`);
}
assert.equal(new Set([...byCompany.values()].map((ids) => ids.join(","))).size, companies.length, "Duplicate full company sheet");
assert.notDeepEqual(byCompany.get("google")?.slice(0, 5), byCompany.get("amazon")?.slice(0, 5));
for (const [category, minimum] of [
  ["package-wise", 200],
  ["patterns", 165],
  ["sql", 105],
  ["system-design", 10],
  ["hr-questions", 100],
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
  `PASS: ${companies.length} companies, ${questions.length} canonical questions, ${placements.length} reference-matched ordered titles and links, and audited category assignments.`,
);
