import { describe, expect, it } from "vitest";
import { clampSplit, formatInput, parseInput } from "./workspace";

const params = [{ name: "levels" }, { name: "limit" }];

describe("formatInput / parseInput", () => {
  it("round-trips an example", () => {
    const text = formatInput(params, [[3, 1, 4], 4]);
    expect(text).toBe("levels = [3,1,4]\nlimit = 4");
    expect(parseInput(params, text)).toEqual({ args: [[3, 1, 4], 4] });
  });
  it("accepts any order, blank lines and spaces", () => {
    expect(parseInput(params, "\n limit=2 \n\nlevels = [ 1 ]\n")).toEqual({ args: [[1], 2] });
  });
  it("names the first problem", () => {
    expect(parseInput(params, "levels = [1]")).toEqual({ error: "Missing a value for limit." });
    expect(parseInput(params, "levels = [1,\nlimit = 2")).toMatchObject({ error: expect.stringContaining("levels isn't valid JSON") });
    expect(parseInput(params, "levels [1]\nlimit = 2")).toMatchObject({ error: expect.stringContaining("name = value") });
    expect(parseInput(params, "levels = [1]\nlimit = 2\nk = 3")).toEqual({ error: "k isn't a parameter of this problem." });
  });
});

describe("clampSplit", () => {
  it("keeps every panel above the minimum and sums to 1", () => {
    const s = clampSplit([0.05, 0.9, 0.05]);
    expect(s.every((v) => v >= 0.18 - 1e-12)).toBe(true);
    expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(clampSplit([0.34, 0.41, 0.25])).toEqual([0.34, 0.41, expect.closeTo(0.25, 10)]);
  });
});
