import { describe, expect, it } from "vitest";
import { groupUpsolveAttempts, pendingUpsolves, type UpsolveSubmission } from "./upsolve";

const problem = { id: "grid", title: "Grid Paths", url: "https://codeforces.com/problemset/problem/1/A", cf_rating: 1200, tags: ["dp"] };
const rows: UpsolveSubmission[] = [
  { problem_id: "grid", verdict: "WRONG_ANSWER", submitted_at: "2026-10-20T00:00:00Z", contest_id: 1, problems: problem },
  { problem_id: "grid", verdict: "TIME_LIMIT_EXCEEDED", submitted_at: "2026-10-19T00:00:00Z", contest_id: 1, problems: problem },
  { problem_id: "accepted", verdict: "OK", submitted_at: "2026-10-18T00:00:00Z", contest_id: 1, problems: { ...problem, id: "accepted" } },
];

describe("upsolve queue", () => {
  it("counts recent unsuccessful attempts and retains the latest verdict", () => {
    const attempts = groupUpsolveAttempts(rows);
    expect(attempts.get("grid")?.attempts).toBe(2);
    expect(attempts.get("grid")?.lastVerdict).toBe("WRONG_ANSWER");
    expect(attempts.has("accepted")).toBe(false);
  });
  it("removes problems with accepted solves", () => {
    const attempts = groupUpsolveAttempts(rows);
    expect(pendingUpsolves(attempts, new Set(["grid"]))).toEqual([]);
  });
});
