import "server-only";
// Direct module imports: the package index also exports the local adapter, which spawns processes and has no place here.
import { digestMode } from "../../../packages/judge/src/generate.mjs";
import { judge } from "../../../packages/judge/src/judge.mjs";
import { createOnlineCompilerAdapter, JudgeUnavailableError } from "../../../packages/judge/src/onlinecompiler.mjs";
import { overallVerdict, shapeResults, slowestMs, type CaseInput } from "@/lib/judge-results";
import { adminSupabase } from "./admin";

// M11 judge flow, in the Next.js app (no engine; DECISIONS.md 2026-11-27): one code-runner call per Run or Submit.
export const LANGS = ["javascript", "python", "cpp", "java"] as const;
export type Lang = (typeof LANGS)[number];
export const MAX_CODE_BYTES = 64 * 1024;
export const MAX_CUSTOM_CASES = 5;

export class JudgeRequestError extends Error {
  constructor(message: string, public status: number, public retryAfter?: number) { super(message); }
}

/** Validates, rate-limits and records a Run or Submit. Returns the submission id; judging happens in processSubmission. */
export async function createSubmission(userId: string, req: { slug: string; lang: Lang; code: string; mode: "run" | "submit"; custom?: unknown[][] }) {
  if (Buffer.byteLength(req.code, "utf8") > MAX_CODE_BYTES) throw new JudgeRequestError("Your code is larger than 64 KB.", 413);
  if ((req.custom?.length ?? 0) > MAX_CUSTOM_CASES) throw new JudgeRequestError(`Use at most ${MAX_CUSTOM_CASES} custom inputs.`, 400);
  const db = adminSupabase();
  const { data: p, error } = await db.from("catalog_problems").select("id, source, pool, is_pro").eq("slug", req.slug).maybeSingle();
  if (error) throw new Error(`Could not load the problem: ${error.message}`);
  if (!p || p.source !== "algogym" || p.pool !== "public") throw new JudgeRequestError("This problem can't be run here.", 404);
  // shortcut: entitlements reach the new app in M18; until then Pro problems stay locked for everyone.
  if (p.is_pro) throw new JudgeRequestError("This problem is part of Pro.", 403);
  const { data: wait, error: rateError } = await db.rpc("judge_take_slot", { p_user: userId, p_mode: req.mode });
  if (rateError) throw new Error(`Rate limit check failed: ${rateError.message}`);
  if (wait > 0) {
    throw new JudgeRequestError(req.mode === "run" ? `You've used 30 runs in 5 minutes. Try again in ${wait} s.` : `You've used 10 submits this minute. Try again in ${wait} s.`, 429, wait);
  }
  const { data: sub, error: insertError } = await db
    .from("submissions")
    .insert({ user_id: userId, problem_id: p.id, lang: req.lang, code: req.code, mode: req.mode, status: "queued", results: req.custom?.length ? { pendingCustom: req.custom } : null })
    .select("id")
    .single();
  if (insertError) throw new Error(`Could not save the submission: ${insertError.message}`);
  return sub.id as string;
}

function runner() {
  const key = process.env.CODE_RUNNER_KEY;
  if (!key) throw new JudgeUnavailableError("Running code isn't set up on this server yet.");
  return createOnlineCompilerAdapter({ url: process.env.CODE_RUNNER_URL || undefined, key, requestTimeoutMs: 40_000 });
}

/** Judges one submission and writes the result. Never throws: failures are written to the row so the client sees them. */
export async function processSubmission(id: string) {
  const db = adminSupabase();
  const fail = async (verdict: string, message: string, retryAfter?: number) => {
    await db.from("submissions").update({ status: "error", verdict, results: { message, ...(retryAfter ? { retryAfter } : {}) } }).eq("id", id);
  };
  try {
    const { data: sub, error } = await db.from("submissions").select("id, user_id, problem_id, lang, code, mode, results").eq("id", id).single();
    if (error) throw new Error(error.message);
    await db.from("submissions").update({ status: "running" }).eq("id", id);
    const [problem, lang, tests] = await Promise.all([
      db.from("catalog_problems").select("signature, comparator").eq("id", sub.problem_id).single(),
      db.from("problem_languages").select("harness_code, time_limit_ms, max_total_ms, memory_kb").eq("problem_id", sub.problem_id).eq("lang", sub.lang).single(),
      db.from("test_cases").select("position, input, expected_output, is_hidden").eq("problem_id", sub.problem_id).order("position"),
    ]);
    for (const r of [problem, lang, tests]) if (r.error) throw new Error(r.error.message);
    const visible = tests.data!.filter((t) => !t.is_hidden);
    const hidden = sub.mode === "submit" ? tests.data!.filter((t) => t.is_hidden) : [];
    const custom: unknown[][] = sub.mode === "run" ? (sub.results?.pendingCustom ?? []) : [];
    const inputs: CaseInput[] = [
      ...visible.map((t) => ({ args: t.input, expected: t.expected_output, hidden: false })),
      ...custom.map((args) => ({ args, hidden: false, custom: true })),
      ...hidden.map((t) => ({ args: t.input, expected: t.expected_output, hidden: true })),
    ];
    const judged = await judge({
      adapter: runner(),
      language: sub.lang,
      harness: lang.data!.harness_code,
      code: sub.code,
      cases: inputs.map((c) => ({ args: c.args, expected: c.expected })),
      limits: { time_ms_per_case: lang.data!.time_limit_ms, max_total_ms: lang.data!.max_total_ms, memory_mb: Math.round(lang.data!.memory_kb / 1024) },
      comparator: problem.data!.comparator,
      // Visible and custom cases print their output; hidden ones print only a fingerprint.
      digestFrom: visible.length + custom.length,
      digestMode: digestMode(problem.data!.signature, problem.data!.comparator),
      slackMs: 5000,
    });
    const results = shapeResults(inputs, judged);
    const verdict = overallVerdict(results);
    await db.from("submissions").update({ status: "done", verdict, results, runtime_ms: slowestMs(results) }).eq("id", id);
    if (sub.mode === "submit") await recordProgress(sub.user_id, sub.problem_id, verdict === "accepted");
  } catch (error) {
    if (error instanceof JudgeUnavailableError) await fail("judge_unavailable", `${error.message} Your code is saved; try again shortly.`, error.retryAfter);
    else { console.error(JSON.stringify({ event: "judge.failed", id, message: error instanceof Error ? error.message : String(error) })); await fail("internal_error", "Something went wrong while judging. Your code is saved; try again."); }
  }
}

async function recordProgress(userId: string, problemId: string, solved: boolean) {
  const db = adminSupabase();
  const { data: current } = await db.from("user_problem_status").select("status").eq("user_id", userId).eq("problem_id", problemId).maybeSingle();
  if (current?.status === "solved") return; // keep the first solve date
  await db.from("user_problem_status").upsert({ user_id: userId, problem_id: problemId, status: solved ? "solved" : "attempted", solved_at: solved ? new Date().toISOString() : null, updated_at: new Date().toISOString() });
}
