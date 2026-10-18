import { describe, expect, it } from "vitest";
import { CF_REWARDS, chakraFor, secondsRemaining, trackProblems } from "./training";
import { readPersisted, writePersisted } from "./persistence";
import { isProblemSolved } from "./utils";

describe("authoritative solve and Chakra boundaries", () => {
  it("never infers a solve from a username", () => {
    for (let id = 0; id < 100; id++) expect(isProblemSolved(`codeforces-${id}A`, "codeforces", undefined, "tourist")).toBe(false);
    expect(isProblemSolved("codeforces-1A", "codeforces", undefined, "tourist", ["codeforces-1A"])).toBe(true);
  });
  it("covers every declared bracket and rejects unrated or out-of-policy ratings", () => {
    for (const [min, max, points] of CF_REWARDS) { expect(chakraFor("codeforces", min)).toBe(points); expect(chakraFor("codeforces", max)).toBe(points); }
    for (const rating of [undefined, 799, 3501, NaN, 1400.5]) expect(chakraFor("codeforces", rating)).toBeNull();
    expect(chakraFor("leetcode", "Medium")).toBe(45);
    expect(chakraFor("leetcode", "Unknown")).toBeNull();
  });
  it("restores persisted sets, safely handles legacy empty objects, and preserves raw legacy handles", () => {
    expect(readPersisted(writePersisted(new Set(["a", "b"])), new Set())).toEqual(new Set(["a", "b"]));
    expect(readPersisted("{}", new Set())).toEqual(new Set());
    expect(readPersisted("tourist", "")).toBe("tourist");
  });
  it("uses elapsed wall time after a suspended tab or refresh", () => {
    expect(secondsRemaining(100_000, 50, 93_500)).toBe(7);
    expect(secondsRemaining(100_000, 50, 120_000)).toBe(0);
    expect(secondsRemaining(null, 50, 120_000)).toBe(50);
  });
  it("does not populate unknown training tracks with invented problems", () => { expect(trackProblems([], "missing")).toEqual([]); });
});
