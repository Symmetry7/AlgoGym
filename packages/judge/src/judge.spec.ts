import { describe, expect, it } from "vitest";
import { LANGUAGES, TYPES, compare, harness, judge, localAdapter, starter, typeName, helpers } from "./index.mjs";

// Needs node, Python 3, g++ and a JDK on PATH (as in CI).
const limits = { time_ms_per_case: 2000, max_total_ms: 10000, memory_mb: 256 };

const tricky = "quote \" back \\ tab \t nl \n héllo ✓ 😀";
const sample: Record<string, unknown[]> = {
  int: [0, -2147483648, 2147483647],
  long: [-9007199254740991, 9007199254740991],
  double: [0.5, -1.25e-7, 3],
  bool: [true, false],
  string: ["", tricky],
  "int[]": [[], [1, -2, 3]],
  "long[]": [[9007199254740991, -1]],
  "double[]": [[0.1, -2.5]],
  "bool[]": [[true, false, true], []],
  "string[]": [["a", tricky], []],
  "int[][]": [[[1, 2], [], [-3]], []],
  "string[][]": [[["x"], [tricky, ""]]],
};

const echo = (language: string, type: string) => {
  if (language === "javascript") return "function echo(x) { return x; }";
  if (language === "python") return "class Solution:\n    def echo(self, x):\n        return x";
  if (language === "cpp") return `class Solution { public: ${typeName.cpp(type)} echo(${typeName.cpp(type)}& x) { return x; } };`;
  return `class Solution { public ${typeName.java(type)} echo(${typeName.java(type)} x) { return x; } }`;
};

describe.concurrent("generated harness round-trips every signature type", () => {
  for (const language of LANGUAGES) {
    it(language, async () => {
      for (const type of TYPES) {
        const sig = { function: "echo", params: [{ name: "x", type }], returns: type };
        const cases = sample[type].map((v) => ({ args: [v], expected: v }));
        const comparator = type.startsWith("double") ? "float_tolerance" : "exact";
        const res = await judge({ adapter: localAdapter, language, harness: harness(sig, language), code: echo(language, type), cases, limits, comparator, slackMs: 15000 });
        expect(res.compileError, `${language} ${type}`).toBeUndefined();
        expect(res.cases!.map((c) => c.verdict), `${language} ${type} ${JSON.stringify(res)}`).toEqual(cases.map(() => "accepted"));

        // The starter must compile and run with the same harness.
        const st = await judge({ adapter: localAdapter, language, harness: harness(sig, language), code: starter(sig, language), cases: cases.slice(0, 1), limits, comparator, slackMs: 15000 });
        expect(st.compileError, `${language} ${type} starter`).toBeUndefined();
      }
    }, 600_000);
  }
});

describe.concurrent("harness contract", () => {
  const sig = { function: "f", params: [{ name: "xs", type: "int[]" }, { name: "k", type: "int" }], returns: "int" };
  const code: Record<string, string> = {
    javascript: `function f(xs, k) { console.log("noise"); if (k < 0) throw new Error("boom"); while (k === 1) {} return xs.length + k; }`,
    python: `class Solution:\n    def f(self, xs, k):\n        print("noise")\n        if k < 0: raise ValueError("boom")\n        while k == 1: pass\n        return len(xs) + k`,
    cpp: `class Solution { public: int f(vector<int>& xs, int k) { cout << "noise"; if (k < 0) throw runtime_error("boom"); volatile int s = 0; while (k == 1) s++; return xs.size() + k; } };`,
    java: `class Solution { public int f(int[] xs, int k) { System.out.print("noise"); if (k < 0) throw new RuntimeException("boom"); while (k == 1) {} return xs.length + k; } }`,
  };
  for (const language of LANGUAGES) {
    it(`${language}: console output ignored, errors per case, hang -> TLE then not_run`, async () => {
      const cases = [
        { args: [[1, 2], 3], expected: 5 },
        { args: [[1], 0], expected: 99 },
        { args: [[], -1], expected: 0 },
        { args: [[], 1], expected: 1 },
        { args: [[], 2], expected: 2 },
      ];
      const res = await judge({ adapter: localAdapter, language, harness: harness(sig, language), code: code[language], cases, limits: { ...limits, time_ms_per_case: 500, max_total_ms: 1500 }, comparator: "exact", slackMs: 1500 });
      expect(res.cases!.map((c) => c.verdict)).toEqual(["accepted", "wrong_answer", "runtime_error", "time_limit_exceeded", "not_run"]);
      expect(res.console).toContain("noise");
    }, 120_000);
  }

  it("reports compile errors", async () => {
    const res = await judge({ adapter: localAdapter, language: "cpp", harness: harness(sig, "cpp"), code: "class Solution {", cases: [], limits, comparator: "exact" });
    expect(res.compileError).toBeTruthy();
  }, 120_000);
});

describe("compare", () => {
  it("handles each comparator", () => {
    expect(compare("exact", [1, [2]], [1, [2]])).toBe(true);
    expect(compare("exact", [1, 2], [2, 1])).toBe(false);
    expect(compare("unordered", [[2], [1]], [[1], [2]])).toBe(true);
    expect(compare("unordered", [1, 1], [1, 2])).toBe(false);
    expect(compare("float_tolerance", [0.1 + 0.2], [0.3])).toBe(true);
    expect(compare("float_tolerance", 1.001, 1)).toBe(false);
  });
});

describe("seeded generator", () => {
  it("is deterministic per seed", () => {
    const a = helpers(42), b = helpers(42), c = helpers(43);
    const xs = a.arr(5, 1, 100);
    expect(b.arr(5, 1, 100)).toEqual(xs);
    expect(c.arr(5, 1, 100)).not.toEqual(xs);
    expect(xs.every((x) => x >= 1 && x <= 100)).toBe(true);
  });
});
