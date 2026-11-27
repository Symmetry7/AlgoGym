import { describe, expect, it } from "vitest";
import { overallVerdict, shapeResults, slowestMs, type CaseInput } from "./judge-results";

const inputs: CaseInput[] = [
  { args: [[1, 2]], expected: 3, hidden: false },
  { args: [[5, 5]], expected: 10, hidden: true },
  { args: [[9]], hidden: false, custom: true },
];

describe("shapeResults", () => {
  it("never stores input, output or expected for hidden cases", () => {
    const r = shapeResults(inputs, { cases: [
      { case: 1, verdict: "accepted", ms: 1.234, output: 3 },
      { case: 2, verdict: "wrong_answer", ms: 2, output: 11, error: "secret" },
      { case: 3, verdict: "wrong_answer", ms: 0.5, output: 9 },
    ], console: "debug" });
    expect(r.cases[1]).toEqual({ case: 2, kind: "hidden", verdict: "wrong_answer", ms: 2 });
    expect(Object.keys(r.cases[1]).sort()).toEqual(["case", "kind", "ms", "verdict"]);
    expect(r.cases[0]).toEqual({ case: 1, kind: "public", verdict: "accepted", input: [[1, 2]], expected: 3, ms: 1.23, output: 3 });
    expect(r.cases[2]).toEqual({ case: 3, kind: "custom", input: [[9]], ran: true, ms: 0.5, output: 9 });
    expect(r.console).toBe("debug");
  });
  it("keeps compile errors and decides the overall verdict (custom cases don't count)", () => {
    expect(overallVerdict(shapeResults(inputs, { compileError: "boom" }))).toBe("compile_error");
    const r = shapeResults(inputs, { cases: [{ case: 1, verdict: "accepted", ms: 1 }, { case: 2, verdict: "time_limit_exceeded" }, { case: 3, verdict: "wrong_answer", ms: 4 }] });
    expect(overallVerdict(r)).toBe("time_limit_exceeded");
    expect(slowestMs(r)).toBe(4);
    expect(overallVerdict(shapeResults(inputs.slice(0, 1), { cases: [{ case: 1, verdict: "accepted", ms: 1 }] }))).toBe("accepted");
  });
});
