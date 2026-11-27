"use client";

import Link from "next/link";
import type { StoredCase } from "@/lib/judge-results";
import { cn } from "@/lib/utils";
import type { JudgeState } from "./use-judge";

const LABEL: Record<string, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong answer",
  runtime_error: "Runtime error",
  time_limit_exceeded: "Time limit exceeded",
  not_run: "Not run",
  compile_error: "Compile error",
};
const show = (v: unknown) => JSON.stringify(v);

function Dot({ verdict }: { verdict: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", verdict === "accepted" ? "bg-ag-accent" : verdict === "not_run" ? "bg-ag-surface-3" : "bg-ag-hard")} />;
}

function Summary({ state }: { state: Extract<JudgeState, { phase: "done" }> }) {
  const graded = state.results.cases.filter((c) => c.kind !== "custom") as Exclude<StoredCase, { kind: "custom" }>[];
  const passed = graded.filter((c) => c.verdict === "accepted").length;
  const ok = state.verdict === "accepted";
  return (
    <p className={cn("font-ui text-[15px] font-semibold", ok ? "text-ag-accent" : "text-ag-hard")}>
      {LABEL[state.verdict] ?? state.verdict}
      {state.verdict !== "compile_error" && graded.length > 0 && <span className="ml-2 text-[13px] font-normal text-ag-text-muted">{passed} / {graded.length} tests passed{state.runtimeMs != null && ` · slowest ${state.runtimeMs} ms`}</span>}
    </p>
  );
}

/** Output tab: what each visible case printed, compile errors and console output. */
export function OutputView({ state, params }: { state: JudgeState; params: string[] }) {
  if (state.phase === "idle") return <p className="text-pretty text-ag-text-faint">Run your code to see output. Ctrl+Enter works too.</p>;
  if (state.phase === "running") return <p className="text-ag-text-muted" role="status">{state.mode === "run" ? "Running your code on the examples…" : "Submitting: checking every test…"}</p>;
  if (state.phase === "error")
    return (
      <p className="text-pretty text-ag-text-muted" role="alert">
        {state.message}{" "}
        {state.signIn && <Link href="/sign-in" className="text-ag-text underline underline-offset-4">Sign in</Link>}
      </p>
    );
  const visible = state.results.cases.filter((c) => c.kind !== "hidden");
  return (
    <div className="space-y-4">
      <Summary state={state} />
      {state.results.compileError && <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-ag-surface-2 p-3 font-geist-mono text-[12px] text-ag-hard">{state.results.compileError}</pre>}
      {visible.map((c) => (
        <div key={c.case} className="rounded-xl border border-ag-border p-3">
          <p className="flex items-center gap-2 font-ui text-[13px] text-ag-text">
            {c.kind === "custom" ? <span>Your input</span> : <><Dot verdict={c.verdict} /> Example {c.case} · {LABEL[c.verdict]}</>}
            {c.ms != null && <span className="text-ag-text-faint">· {c.ms} ms</span>}
          </p>
          <dl className="mt-2 space-y-1 font-geist-mono text-[12px]">
            {params.map((name, k) => <div key={name} className="flex gap-2 overflow-x-auto"><dt className="shrink-0 text-ag-text-faint">{name} =</dt><dd className="whitespace-pre text-ag-text">{show(c.input[k])}</dd></div>)}
            {"output" in c && <div className="flex gap-2 overflow-x-auto"><dt className="shrink-0 text-ag-text-faint">output</dt><dd className="whitespace-pre text-ag-text">{show(c.output)}</dd></div>}
            {c.kind === "public" && c.verdict !== "accepted" && <div className="flex gap-2 overflow-x-auto"><dt className="shrink-0 text-ag-text-faint">expected</dt><dd className="whitespace-pre text-ag-text">{show(c.expected)}</dd></div>}
          </dl>
          {c.error && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-geist-mono text-[12px] text-ag-hard">{c.error}</pre>}
        </div>
      ))}
      {state.results.console && (
        <div>
          <p className="font-ui text-[12px] text-ag-text-faint">Printed by your code</p>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-ag-surface-2 p-3 font-geist-mono text-[12px] text-ag-text-muted">{state.results.console}</pre>
        </div>
      )}
    </div>
  );
}

/** Tests tab: one line per case, hidden ones by number only. */
export function TestsView({ state, examples }: { state: JudgeState; examples: number }) {
  if (state.phase !== "done" || state.results.compileError) {
    return (
      <div className="font-ui">
        <p className="text-pretty text-[13px] text-ag-text-faint">{state.phase === "running" ? "Checking…" : "Submit to check every hidden test. Ctrl+Shift+Enter works too."}</p>
        <ul className="mt-3 space-y-2">
          {Array.from({ length: examples }, (_, i) => <li key={i} className="flex items-center gap-2 text-[13px] text-ag-text-muted"><Dot verdict="not_run" /> Example {i + 1} <span className="text-ag-text-faint">· not run</span></li>)}
        </ul>
      </div>
    );
  }
  const graded = state.results.cases.filter((c) => c.kind !== "custom") as Exclude<StoredCase, { kind: "custom" }>[];
  let hiddenNo = 0;
  return (
    <div className="font-ui">
      <Summary state={state} />
      <ul className="mt-3 space-y-2">
        {graded.map((c) => (
          <li key={c.case} className="flex items-center gap-2 text-[13px] text-ag-text-muted">
            <Dot verdict={c.verdict} />
            {c.kind === "hidden" ? `Hidden test ${++hiddenNo}` : `Example ${c.case}`}
            <span className={cn(c.verdict === "accepted" ? "text-ag-text-faint" : "text-ag-text")}>· {LABEL[c.verdict]}</span>
            {c.ms != null && <span className="text-ag-text-faint">· {c.ms} ms</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
