// Shapes judge output for storage in submissions.results and for the workspace (M11). Pure, so it's unit-tested.
// Hidden cases keep only case number, verdict and runtime (DECISIONS.md 2026-11-24): never input, output or expected.

export type Verdict = "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" | "not_run";

export interface CaseInput {
  args: unknown[];
  expected?: unknown; // absent for custom input
  hidden: boolean;
  custom?: boolean;
}

export interface JudgedCase { case: number; verdict: Verdict; ms?: number; output?: unknown; error?: string }

export type StoredCase =
  | { case: number; kind: "hidden"; verdict: Verdict; ms?: number }
  | { case: number; kind: "public"; verdict: Verdict; ms?: number; input: unknown[]; output?: unknown; expected: unknown; error?: string }
  | { case: number; kind: "custom"; ms?: number; input: unknown[]; output?: unknown; error?: string; ran: boolean };

export interface StoredResults {
  cases: StoredCase[];
  console?: string;
  compileError?: string;
}

const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n)}…` : s);

export function shapeResults(inputs: CaseInput[], judged: { cases?: JudgedCase[]; console?: string; compileError?: string }): StoredResults {
  if (judged.compileError != null) return { cases: [], compileError: clip(judged.compileError, 8000) };
  const cases: StoredCase[] = (judged.cases ?? []).map((c, i) => {
    const input = inputs[i];
    if (input.hidden) return { case: c.case, kind: "hidden", verdict: c.verdict, ...(c.ms != null ? { ms: round(c.ms) } : {}) };
    if (input.custom) return { case: c.case, kind: "custom", input: input.args, ran: c.verdict !== "not_run", ...(c.ms != null ? { ms: round(c.ms) } : {}), ...("output" in c ? { output: c.output } : {}), ...(c.error ? { error: clip(c.error, 2000) } : {}) };
    return { case: c.case, kind: "public", verdict: c.verdict, input: input.args, expected: input.expected, ...(c.ms != null ? { ms: round(c.ms) } : {}), ...("output" in c ? { output: c.output } : {}), ...(c.error ? { error: clip(c.error, 2000) } : {}) };
  });
  return { cases, ...(judged.console ? { console: clip(judged.console, 4000) } : {}) };
}

const round = (ms: number) => Math.round(ms * 100) / 100;

/** The submission's overall verdict: compile error, else the first case that wasn't accepted, else accepted. Custom cases don't count. */
export function overallVerdict(results: StoredResults): Verdict | "compile_error" {
  if (results.compileError != null) return "compile_error";
  const graded = results.cases.filter((c): c is Exclude<StoredCase, { kind: "custom" }> => c.kind !== "custom");
  return graded.find((c) => c.verdict !== "accepted")?.verdict ?? "accepted";
}

export const slowestMs = (results: StoredResults) => {
  const ms = results.cases.map((c) => c.ms ?? 0);
  return ms.length ? Math.round(Math.max(...ms)) : null;
};
