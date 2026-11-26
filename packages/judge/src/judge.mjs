// The judge interface: one adapter call per Run/Submit (docs/DECISIONS.md, 2026-11-24).
// An adapter is `async run({ language, source, stdin, timeoutMs, memoryMb })` returning
// `{ compileError?, stdout, stderr, exitCode, timedOut }`. `local.mjs` is the trusted-code adapter; Judge0 arrives in M11.
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { combine } from "./generate.mjs";

export function compare(comparator, got, want) {
  if (comparator === "exact") return isDeepStrictEqual(got, want);
  if (comparator === "unordered") {
    if (!Array.isArray(got) || !Array.isArray(want) || got.length !== want.length) return false;
    const key = (xs) => xs.map((x) => JSON.stringify(x)).sort();
    return isDeepStrictEqual(key(got), key(want));
  }
  if (comparator === "float_tolerance") return near(got, want);
  throw new Error(`Unknown comparator ${comparator}`);
}

function near(got, want) {
  if (typeof want === "number") return typeof got === "number" && Math.abs(got - want) <= 1e-6 * Math.max(1, Math.abs(want));
  if (Array.isArray(want)) return Array.isArray(got) && got.length === want.length && want.every((w, i) => near(got[i], w));
  return isDeepStrictEqual(got, want);
}

// Overall limit = per-case limit x case count, capped by the problem's max_total_ms (SYSTEM_ARCHITECTURE.md §4.2).
export const budgetMs = (limits, caseCount) => Math.min(limits.time_ms_per_case * caseCount, limits.max_total_ms);

/**
 * Run `code` against `cases` ([{ args, expected }]) in one process. Expected outputs stay here; only args go to the adapter.
 * Returns { compileError } or { cases: [{ case, verdict, ms?, output?, error? }], console, exitCode, timedOut }.
 * Verdicts: accepted, wrong_answer, runtime_error, time_limit_exceeded, not_run.
 */
export async function judge({ adapter, language, harness, code, cases, limits, comparator, slackMs = 0 }) {
  const nonce = randomUUID().replace(/-/g, "");
  const budget = budgetMs(limits, cases.length);
  const source = combine(harness, code, { nonce, budgetMs: budget });
  const stdin = cases.map((c) => JSON.stringify(c.args)).join("\n") + "\n";
  const res = await adapter.run({ language, source, stdin, timeoutMs: budget + slackMs, memoryMb: limits.memory_mb });
  if (res.compileError != null) return { compileError: res.compileError };

  const prefix = `{"n":"${nonce}",`;
  const lines = {};
  const consoleOut = [];
  for (const line of res.stdout.split("\n")) {
    if (line.startsWith(prefix)) {
      try { const rec = JSON.parse(line); lines[rec.case] = rec; continue; } catch { /* a truncated last line falls through to console */ }
    }
    if (line.trim()) consoleOut.push(line);
  }

  let missingSeen = false;
  const results = cases.map((c, i) => {
    const rec = lines[i + 1];
    if (!rec) {
      // A clean exit means the harness stopped at the budget: nothing left was started. Otherwise the first
      // missing case was in flight when the process was killed (timeout) or crashed.
      const inFlight = res.timedOut ? "time_limit_exceeded" : res.exitCode === 0 ? "not_run" : "runtime_error";
      const verdict = missingSeen ? "not_run" : inFlight;
      missingSeen = true;
      return { case: i + 1, verdict, ...(verdict === "runtime_error" && res.stderr ? { error: res.stderr.slice(-2000) } : {}) };
    }
    if (rec.error != null) return { case: i + 1, verdict: "runtime_error", error: rec.error };
    const verdict = rec.ms > limits.time_ms_per_case ? "time_limit_exceeded" : compare(comparator, rec.output, c.expected) ? "accepted" : "wrong_answer";
    return { case: i + 1, verdict, ms: rec.ms, output: rec.output };
  });
  return { cases: results, console: consoleOut.join("\n"), exitCode: res.exitCode, timedOut: res.timedOut };
}
