import { describe, expect, it } from "vitest";
import { answerParts, filterItems, filterOptions, parseFilters, type InterviewItem } from "./interview-items";

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
