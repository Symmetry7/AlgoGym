import assert from "node:assert/strict";
import { test } from "node:test";
import { gfgSlug, itemTracks, leetcodeSlug, plan, sheetTracks, sourceKeys, titleKey } from "./hynts.mjs";

const q = (position, title, extra = {}) => ({ position, title, difficulty: "Medium", category: null, platform: null, url: null, tags: [], ...extra });
const catalog = {
  sheets: [
    { section: "company", slug: "acme", title: "Acme", sourceUrl: "https://src/acme/", observedAt: "2026-11-28", items: [
      q(1, "Two Sum", { url: "https://leetcode.com/problems/two-sum/" }),
      q(2, "Brand New", { url: "https://leetcode.com/problems/brand-new/" }),
      q(3, "Brand  New!", { url: "https://www.geeksforgeeks.org/problems/brand-new-gfg/1" }), // same title as a planned LeetCode row
      q(4, "Only On GFG", { url: "https://www.geeksforgeeks.org/problems/only_on_gfg/1" }),
      q(5, "Two Sum", { url: "https://leetcode.com/problems/two-sum/" }), // repeated in the sheet
    ] },
    { section: "company", slug: "walmart", title: "Walmart", sourceUrl: "https://src/walmart/", observedAt: "2026-11-28", items: [q(1, "Two Sum", { url: "https://leetcode.com/problems/two-sum/" })] },
    { section: "role", slug: "frontend-developer", title: null, sourceUrl: "https://src/fe/", observedAt: "2026-11-28", items: [
      q(1, "Tell me about yourself", { category: "Behavioral" }), q(2, "What is a closure?", { category: "JavaScript Core" }),
    ] },
  ],
};
const db = {
  problems: [
    { id: "p-lc", slug: "lc-two-sum", title: "Two Sum", source: "leetcode", source_ref: "two-sum", difficulty: "Easy" },
    { id: "p-orig", slug: "pair-sum", title: "Pair Sum", source: "algogym", source_ref: null, difficulty: "Easy" },
  ],
  similar: [{ original_id: "p-orig", similar_id: "p-lc" }],
  items: [{ id: "i-hr", question: "Tell me about yourself." }],
  companies: [{ id: "c-acme", slug: "acme", name: "ACME Corp" }, { id: "c-wm", slug: "walmart-labs", name: "Walmart Labs" }],
  names: new Map([["role:frontend-developer", { title: "Frontend Developer", group: "Development" }]]),
};

test("URL slugs and title keys", () => {
  assert.equal(leetcodeSlug("https://leetcode.com/problems/Two-Sum/description/"), "two-sum");
  assert.equal(leetcodeSlug("https://www.geeksforgeeks.org/problems/x/1"), null);
  assert.equal(gfgSlug("https://www.geeksforgeeks.org/problems/only_on_gfg/1"), "only-on-gfg");
  assert.equal(titleKey("Brand  New!"), titleKey("brand new"));
});

test("source keys stay unique when a title repeats in a sheet", () => {
  assert.deepEqual(sourceKeys("company", "acme", [{ title: "A b" }, { title: "a B" }, { title: "c" }]), ["company/acme/ab", "company/acme/ab#2", "company/acme/c"]);
});

test("tracks: by sheet, plus what a role question's category names", () => {
  assert.deepEqual(sheetTracks("role", "llm-genai-engineer"), ["interview-prep", "ai-llm"]);
  assert.deepEqual(sheetTracks("topic", "dbms-questions"), ["cs-fundamentals", "sql-database"]);
  assert.deepEqual(sheetTracks("topic", "swift-questions"), []);
  assert.deepEqual(itemTracks("role", "frontend-developer", "Behavioral"), ["hr-behavioural", "interview-prep", "frontend"]);
  assert.deepEqual(itemTracks("topic", "os-questions", "OS Architecture"), ["cs-fundamentals"]);
  assert.deepEqual(itemTracks("company", "acme", "Behavioral"), ["dsa"]);
});

test("plans only missing companies and problems, and maps titles across platforms", () => {
  const p = plan(catalog, db);
  assert.deepEqual(p.companies, [{ slug: "acme", name: "ACME Corp" }, { slug: "walmart-labs", name: "Walmart Labs" }]);
  // brand-new gets a LeetCode row; the GFG question with the same title reuses it instead of adding a GFG row.
  assert.deepEqual(p.newProblems.map((x) => [x.slug, x.source, x.source_url, x.status]), [["lc-brand-new", "leetcode", null, "pending"], ["gfg-only-on-gfg", "gfg", null, "pending"]]);
});

test("final rows: links, practice originals, answers, no duplicates; a second plan adds nothing", () => {
  const created = [
    { id: "p-new", slug: "lc-brand-new", title: "Brand New", source: "leetcode", source_ref: "brand-new", difficulty: "Medium" },
    { id: "p-gfg", slug: "gfg-only-on-gfg", title: "Only On GFG", source: "gfg", source_ref: "only-on-gfg", difficulty: "Medium" },
  ];
  const p = plan(catalog, { ...db, problems: [...db.problems, ...created] });
  assert.deepEqual(p.newProblems, []);
  const acme = p.rows.filter((r) => r.sheet_slug === "acme");
  assert.deepEqual(acme.map((r) => [r.source_key, r.problem_id, r.practice_problem_id]), [
    ["company/acme/twosum", "p-lc", "p-orig"],
    ["company/acme/brandnew", "p-new", null],
    ["company/acme/brandnew#2", "p-new", null],
    ["company/acme/onlyongfg", "p-gfg", null],
    ["company/acme/twosum#2", "p-lc", "p-orig"],
  ]);
  assert.deepEqual(p.links.map((l) => `${l.problem_id}|${l.company_id}|${l.timeframe}`), ["p-lc|c-acme|all", "p-new|c-acme|all", "p-gfg|c-acme|all", "p-lc|c-wm|all"]);
  assert.deepEqual(p.rows.find((r) => r.sheet_slug === "walmart").companies, ["walmart-labs"]);
  const role = p.rows.filter((r) => r.section === "role");
  assert.deepEqual(role.map((r) => [r.interview_item_id, r.roles, r.problem_id]), [["i-hr", ["frontend-developer"], null], [null, ["frontend-developer"], null]]);
  const fe = p.sheets.find((s) => s.slug === "frontend-developer");
  assert.equal(fe.title, "Frontend Developer");
  assert.equal(fe.group_name, "Development");
  assert.equal(fe.item_count, 2);
  // Provenance stays in its own column; no row carries answer text.
  assert.equal(acme[0].provenance_url, "https://leetcode.com/problems/two-sum/");
  assert.ok(p.rows.every((r) => !("answer_md" in r)));
});
