import { readFileSync } from "node:fs";
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
  readAll("interview_sheet_questions", "company_slug,question_id"),
  readAll("interview_category_questions", "category_slug,question_id"),
]);
assert.equal(companies.length, 45);
assert.ok(questions.length >= 90);
assert.ok(placements.length >= 1350);
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
      .map((entry) => entry.question_id),
  ]),
);
assert.ok(
  [...byCompany.values()].every(
    (ids) => ids.length >= 30 && new Set(ids).size === ids.length,
  ),
);
assert.notDeepEqual(byCompany.get("google"), byCompany.get("amazon"));
for (const [category, minimum] of [
  ["patterns", 56],
  ["sql", 8],
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
console.log(
  `PASS: ${companies.length} companies, ${questions.length} canonical questions, ${placements.length} valid placements, distinct company tracks, and complete category assignments.`,
);
