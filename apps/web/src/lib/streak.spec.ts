import { describe, expect, it } from "vitest";
import { currentStreak, longestStreak } from "./streak";

const days = new Set(["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-26", "2026-11-27"]);

describe("streaks", () => {
  it("counts back from today, or from yesterday when today has no solve yet", () => {
    expect(currentStreak(days, "2026-11-27")).toBe(2);
    expect(currentStreak(days, "2026-11-28")).toBe(2);
    expect(currentStreak(days, "2026-11-29")).toBe(0);
    expect(currentStreak(new Set(), "2026-11-28")).toBe(0);
  });
  it("finds the longest run, across month boundaries", () => {
    expect(longestStreak(days)).toBe(3);
    expect(longestStreak(new Set(["2026-10-31", "2026-11-01"]))).toBe(2);
    expect(longestStreak(new Set())).toBe(0);
  });
});
