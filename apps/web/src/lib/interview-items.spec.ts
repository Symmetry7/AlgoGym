import { describe, expect, it } from "vitest";
import {
  answerParts, filterItems, filterOptions, filterSheetQuestions, groupByCategory, groupSheets, isSheetSection, parseFilters, sheetQuestionHref,
  type InterviewItem, type InterviewSheet, type SheetQuestion,
} from "./interview-items";

const item = (over: Partial<InterviewItem>): InterviewItem => ({
  id: over.question ?? "x", kind: "hr", question: "Q", answer_md: "A", tags: [], companies: [], roles: [],
  difficulty: "Easy", reference_url: null, position: 0, ...over,
});

const items = [
  item({ question: "Tell me about yourself", tags: ["Introduction"], companies: ["tcs"], roles: ["frontend-developer"] }),
  item({ question: "Why this company?", tags: ["Motivation"], companies: ["infosys", "tcs"], difficulty: "Medium" }),
  item({ kind: "sql", question: "Second highest salary", answer_md: "```sql\nSELECT MAX(salary)\n```", tags: ["Subqueries"], roles: ["data-analyst"], difficulty: "Hard" }),
];

describe("filterItems", () => {
  it("filters by kind", () => {
    expect(filterItems(items, { kind: "sql" }).map((i) => i.question)).toEqual(["Second highest salary"]);
    expect(filterItems(items, { kind: "all" })).toHaveLength(3);
  });
  it("filters by company and role", () => {
    expect(filterItems(items, { kind: "all", company: "tcs" })).toHaveLength(2);
    expect(filterItems(items, { kind: "all", company: "infosys" }).map((i) => i.question)).toEqual(["Why this company?"]);
    expect(filterItems(items, { kind: "all", role: "data-analyst" }).map((i) => i.kind)).toEqual(["sql"]);
    expect(filterItems(items, { kind: "hr", role: "data-analyst" })).toEqual([]);
  });
  it("combines topic, difficulty and search (question or answer, any case)", () => {
    expect(filterItems(items, { kind: "all", topic: "Motivation", difficulty: "Medium" })).toHaveLength(1);
    expect(filterItems(items, { kind: "all", q: "SELECT max" })).toHaveLength(1);
    expect(filterItems(items, { kind: "all", q: "yourself", company: "infosys" })).toEqual([]);
  });
});

describe("filterOptions", () => {
  it("counts values within the chosen kind, most common first", () => {
    const all = filterOptions(items, "all");
    expect(all.companies).toEqual([{ value: "tcs", n: 2 }, { value: "infosys", n: 1 }]);
    expect(filterOptions(items, "sql").companies).toEqual([]);
    expect(filterOptions(items, "sql").roles).toEqual([{ value: "data-analyst", n: 1 }]);
  });
});

describe("parseFilters", () => {
  it("keeps known values and drops the rest", () => {
    expect(parseFilters({ kind: "sql", difficulty: "Hard", company: " tcs " })).toMatchObject({ kind: "sql", difficulty: "Hard", company: "tcs" });
    expect(parseFilters({ kind: "dsa", difficulty: "Impossible", q: "  " })).toMatchObject({ kind: "all", difficulty: undefined, q: undefined });
    expect(parseFilters({ kind: ["hr", "sql"] }).kind).toBe("hr");
  });
});

describe("answerParts", () => {
  it("splits prose and sql blocks", () => {
    expect(answerParts("Use a subquery.\n```sql\nSELECT 1;\n```")).toEqual([{ type: "text", value: "Use a subquery." }, { type: "code", value: "SELECT 1;" }]);
    expect(answerParts("Plain answer.")).toEqual([{ type: "text", value: "Plain answer." }]);
  });
});

describe("question sheets", () => {
  const sq = (over: Partial<SheetQuestion>): SheetQuestion => ({
    id: over.title ?? "x", position: 1, title: "Q", difficulty: null, category: null, subcategory: null, level: null, practice: null, answer: null, ...over,
  });
  it("opens practice problems and our answers inside Algogym, and nothing else", () => {
    expect(sheetQuestionHref(sq({ practice: { slug: "pair-sum", title: "Pair Sum" } }))).toBe("/problems/pair-sum");
    expect(sheetQuestionHref(sq({ answer: { kind: "hr", question: "Tell me about yourself" } }))).toBe("/interview?kind=hr&q=Tell+me+about+yourself#answers");
    expect(sheetQuestionHref(sq({}))).toBeNull();
  });
  it("groups sheets by section in display order and drops empty sections", () => {
    const sheet = (section: InterviewSheet["section"], slug: string, position: number): InterviewSheet => ({ section, slug, title: slug, group_name: null, item_count: 1, position });
    const groups = groupSheets([sheet("role", "b", 2), sheet("company", "google", 1), sheet("role", "a", 1)]);
    expect(groups.map((g) => [g.section, g.sheets.map((s) => s.slug)])).toEqual([["company", ["google"]], ["role", ["a", "b"]]]);
    expect(isSheetSection("role")).toBe(true);
    expect(isSheetSection("playlists")).toBe(false);
  });
  it("filters by search and difficulty, and groups consecutive categories", () => {
    const qs = [sq({ title: "Closures", category: "JS", difficulty: "Easy" }), sq({ title: "Event loop", category: "JS", difficulty: "Hard" }), sq({ title: "Box model", category: "CSS", difficulty: "Easy" })];
    expect(filterSheetQuestions(qs, { difficulty: "Easy" }).map((q) => q.title)).toEqual(["Closures", "Box model"]);
    expect(filterSheetQuestions(qs, { q: "css" }).map((q) => q.title)).toEqual(["Box model"]);
    expect(groupByCategory(qs).map((g) => [g.category, g.questions.length])).toEqual([["JS", 2], ["CSS", 1]]);
  });
});
