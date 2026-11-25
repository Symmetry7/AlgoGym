import { describe, it, expect } from "vitest";
import { parseProblemURL, studyAction } from "./study-validation";
describe("study workspace validation", () => {
  it("normalizes supported problem URLs without losing multi-character indices", () => {
    expect(
      parseProblemURL("https://codeforces.com/contest/123/problem/A1"),
    ).toMatchObject({ provider: "codeforces", id: "123:A1" });
    expect(
      parseProblemURL("https://leetcode.com/problems/two-sum/description/?x=1"),
    ).toMatchObject({ provider: "leetcode", id: "two-sum" });
  });
  it("rejects untrusted hosts, credentials, ports and protocols", () => {
    for (const url of [
      "http://localhost/problems/two-sum",
      "https://leetcode.com.evil.test/problems/two-sum",
      "https://user@leetcode.com/problems/two-sum",
      "https://leetcode.com:444/problems/two-sum",
      "https://127.0.0.1/",
    ])
      expect(() => parseProblemURL(url)).toThrow();
  });
  it("rejects forged identity fields and oversized notes", () => {
    expect(
      studyAction.safeParse({
        action: "question.add",
        url: "https://leetcode.com/problems/two-sum/",
        user_id: "forged",
      }).success,
    ).toBe(false);
    expect(
      studyAction.safeParse({
        action: "note.save",
        title: "Note",
        body: "a".repeat(40001),
      }).success,
    ).toBe(false);
  });
});
