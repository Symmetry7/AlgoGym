import { describe, expect, it } from "vitest";
import { askedFrequency, dailyPick, frequencyBars, hrefWith, monthGrid, parseCatalogFilters, queryCatalog, solveProgress, tagCounts, timeAgo, topCompanies, type CatalogProblem } from "./problem-catalog";

const p = (over: Partial<CatalogProblem>): CatalogProblem => ({
  id: over.slug ?? "x", slug: "x", title: "X", difficulty: "Easy", source: "algogym", sourceUrl: null, isPro: false,
  tags: [], similar: null, companyCount: 0, frequency: {}, ...over,
});

const all = [
  p({ slug: "lc-two-sum", title: "Two Sum", source: "leetcode", companyCount: 30, frequency: { google: 100, amazon: 90 } }),
  p({ slug: "lc-rotate-array", title: "Rotate Array", source: "leetcode", difficulty: "Medium", companyCount: 5, frequency: { google: 20 } }),
  p({ slug: "shift-rotation", title: "Shift Rotation", tags: ["arrays-and-strings"] }),
  p({ slug: "widest-banner", title: "Widest Banner", difficulty: "Hard", isPro: true, tags: ["stacks-and-queues"] }),
];
const base = parseCatalogFilters({});

describe("queryCatalog", () => {
  it("puts originals first, then the most-asked metadata rows", () => {
    expect(queryCatalog(all, base).rows.map((r) => r.slug)).toEqual(["shift-rotation", "widest-banner", "lc-two-sum", "lc-rotate-array"]);
  });
  it("orders by that company's frequency when a company is chosen", () => {
    const r = queryCatalog(all, { ...base, company: "google" });
    expect(r.rows.map((x) => x.slug)).toEqual(["lc-two-sum", "lc-rotate-array"]);
    expect(queryCatalog(all, { ...base, company: "amazon" }).total).toBe(1);
  });
  it("combines search, difficulty, source, tag and access filters", () => {
    expect(queryCatalog(all, { ...base, q: "ROTAT" }).total).toBe(2);
    expect(queryCatalog(all, { ...base, q: "rotat", source: "algogym" }).rows.map((r) => r.slug)).toEqual(["shift-rotation"]);
    expect(queryCatalog(all, { ...base, source: "external", difficulty: "Medium" }).rows.map((r) => r.slug)).toEqual(["lc-rotate-array"]);
    expect(queryCatalog(all, { ...base, tag: "stacks-and-queues", access: "pro" }).total).toBe(1);
    expect(queryCatalog(all, { ...base, access: "free", difficulty: "Hard" }).total).toBe(0);
  });
  it("sorts by difficulty rank, not alphabetically", () => {
    expect(queryCatalog(all, { ...base, sort: "difficulty" }).rows.map((r) => r.difficulty)).toEqual(["Easy", "Easy", "Medium", "Hard"]);
  });
  it("paginates and clamps the page", () => {
    const many = Array.from({ length: 120 }, (_, i) => p({ slug: `p${i}`, title: `P${String(i).padStart(3, "0")}` }));
    const last = queryCatalog(many, { ...base, page: 9 });
    expect([last.page, last.pages, last.rows.length, last.total]).toEqual([3, 3, 20, 120]);
  });
});

describe("parseCatalogFilters / hrefWith", () => {
  it("drops unknown values", () => {
    expect(parseCatalogFilters({ difficulty: "Insane", source: "x", sort: "random", page: "-2" })).toMatchObject({ difficulty: undefined, source: undefined, sort: "default", page: 1 });
  });
  it("round-trips and resets the page on a filter change", () => {
    const f = parseCatalogFilters({ q: "sum", company: "google", page: "3" });
    expect(hrefWith(f, { difficulty: "Hard" })).toBe("/problems?q=sum&difficulty=Hard&company=google");
    expect(hrefWith(f, { page: 4 })).toBe("/problems?q=sum&company=google&page=4");
    expect(hrefWith(base, {})).toBe("/problems");
  });
});

describe("tagCounts and frequencyBars", () => {
  it("counts tags and maps frequency to 0-5 bars", () => {
    expect(tagCounts(all)).toEqual([{ slug: "arrays-and-strings", n: 1 }, { slug: "stacks-and-queues", n: 1 }]);
    expect([0, 0.5, 20, 21, 100].map(frequencyBars)).toEqual([0, 1, 1, 2, 5]);
  });
});

describe("status and list filters", () => {
  it("uses the visitor's solved set and a list's items", () => {
    const solved = new Set(["shift-rotation"]);
    expect(queryCatalog(all, { ...base, status: "solved" }, { solved }).rows.map((r) => r.slug)).toEqual(["shift-rotation"]);
    expect(queryCatalog(all, { ...base, status: "unsolved" }, { solved }).total).toBe(3);
    expect(queryCatalog(all, { ...base, list: "x" }, { only: new Set(["lc-two-sum", "widest-banner"]) }).rows.map((r) => r.slug)).toEqual(["widest-banner", "lc-two-sum"]);
  });
});

describe("monthGrid and dailyPick", () => {
  it("lays a month out Monday-first", () => {
    const nov = monthGrid(2026, 11); // 1 Nov 2026 is a Sunday
    expect(nov[0]).toEqual([null, null, null, null, null, null, 1]);
    expect(nov.flat().filter(Boolean)).toHaveLength(30);
    expect(nov.every((w) => w.length === 7)).toBe(true);
  });
  it("picks the same problem for a date, and handles an empty pool", () => {
    const pool = ["a", "b", "c", "d"];
    expect(dailyPick("2026-11-27", pool)).toBe(dailyPick("2026-11-27", pool));
    expect(new Set(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"].map((d) => dailyPick(d, pool))).size).toBeGreaterThan(1);
    expect(dailyPick("2026-11-27", [])).toBeNull();
  });
});

describe("askedFrequency, topCompanies and solveProgress", () => {
  it("uses the chosen company's frequency, else the highest", () => {
    expect(askedFrequency(all[0])).toBe(100);
    expect(askedFrequency(all[0], "amazon")).toBe(90);
    expect(askedFrequency(all[0], "meta")).toBe(0);
    expect(askedFrequency(all[2])).toBe(0);
    expect(topCompanies(all[0])).toEqual(["google", "amazon"]);
    expect(topCompanies(all[0], new Map([["amazon", 0], ["google", 1]]))).toEqual(["amazon", "google"]);
  });
  it("counts only solvable problems, per difficulty", () => {
    const r = solveProgress(all, new Set(["widest-banner", "lc-two-sum"]));
    expect(r).toMatchObject({ solved: 1, total: 2 });
    expect(r.by.Hard).toEqual({ solved: 1, total: 1 });
    expect(r.by.Easy).toEqual({ solved: 0, total: 1 });
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-28T12:00:00Z");
  it("reads naturally at each scale", () => {
    expect(timeAgo("2026-11-28T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-11-28T11:55:00Z", now)).toBe("5 minutes ago");
    expect(timeAgo("2026-11-28T09:00:00Z", now)).toBe("3 hours ago");
    expect(timeAgo("2026-11-27T10:00:00Z", now)).toBe("yesterday");
    expect(timeAgo("2026-09-01T10:00:00Z", now)).toBe("1 Sept");
  });
});
