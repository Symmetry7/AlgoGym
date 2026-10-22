import { describe, expect, it } from "vitest";
import { codeforcesProblemKey, parseCodeforcesProblem } from "./codeforces-contest-catalog";

describe("Codeforces contest problem identity", () => {
  it.each(["4A", "4a", "https://codeforces.com/problemset/problem/4/A", "https://codeforces.com/contest/4/problem/A"])("accepts %s", input => {
    expect(parseCodeforcesProblem(input)).toEqual({ contestId: 4, index: "A" });
  });
  it("keeps contest ID and index separate for stable matching", () => {
    expect(codeforcesProblemKey(1700, "b")).toBe("1700B");
  });
  it.each(["https://evil.example/contest/4/problem/A", "https://codeforces.com/contest/4", "4", "https://codeforces.com.evil.example/problemset/problem/4/A"])("rejects %s", input => {
    expect(() => parseCodeforcesProblem(input)).toThrow();
  });
});
