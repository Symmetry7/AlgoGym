import { describe, it, expect } from "vitest";
import {
  submissionSummary,
  filterSubmissions,
  toCSV,
  type CFSubmission,
} from "./codeforces-analytics";
const row: CFSubmission = {
  id: "1",
  problemId: "42:A",
  title: "=formula",
  index: "A",
  contestId: 42,
  rating: 1500,
  tags: ["dp"],
  verdict: "WRONG_ANSWER",
  language: "C++",
  runtime: 0,
  memory: 0,
  date: "2026-10-17T00:00:00.000Z",
  relativeSeconds: 10,
  participantType: "CONTESTANT",
  url: "https://codeforces.com/",
};
describe("Codeforces public evidence analytics", () => {
  it("separates attempts, accepted submissions and unique solves", () => {
    const data = submissionSummary([
      row,
      { ...row, id: "2", verdict: "OK" },
      { ...row, id: "3", verdict: "OK", runtime: 15 },
    ]);
    expect(data.accepted).toBe(2);
    expect(data.unique).toBe(1);
    expect(data.attemptsPerSolve).toBe(3);
    expect(data.failedTags).toEqual([["dp", 1]]);
    expect(data.fastest).toBe(0);
  });
  it("does not invent rates in an empty history", () => {
    expect(submissionSummary([]).acRate).toBeNull();
    expect(submissionSummary([]).fastest).toBeNull();
  });
  it("combines filters and excludes unrated problems only when rating is constrained", () => {
    const filter = {
      verdict: "",
      min: "",
      max: "",
      tag: "",
      language: "",
      search: "",
    };
    expect(
      filterSubmissions([row, { ...row, rating: null }], filter),
    ).toHaveLength(2);
    expect(
      filterSubmissions([row, { ...row, rating: null }], {
        ...filter,
        min: "1400",
        max: "1600",
        tag: "dp",
        language: "C++",
      }),
    ).toHaveLength(1);
    expect(filterSubmissions([row], { ...filter, verdict: "OK" })).toHaveLength(
      0,
    );
  });
  it("escapes CSV quotes and spreadsheet formulas", () => {
    const csv = toCSV([row, { ...row, title: 'A "quoted", title' }]);
    expect(csv).toContain('"\'=formula"');
    expect(csv).toContain('"A ""quoted"", title"');
  });
});
