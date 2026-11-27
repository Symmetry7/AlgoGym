"use client";

import { Check, Lock, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { useVisible } from "./reveal";

// Landing demos (DESIGN.md §6.1 "How it works"): small, real interactions with sample data.

const frame = "rounded-ag-card border border-ag-border bg-ag-surface-1 p-4 shadow-[var(--ag-inset-highlight)] sm:p-6";
const chip = (on: boolean) =>
  cn("rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-ag-hover", focusRing, on ? "border-ag-text bg-ag-text text-ag-bg" : "border-ag-border-strong text-ag-text-muted hover:text-ag-text");

const TOPICS = ["Arrays & Strings", "Hashing", "Two pointers", "Binary search", "Stack & Queue", "Linked lists", "Trees", "Graphs", "Heaps", "Greedy", "Dynamic programming"];

export function PlanDemo() {
  const companies = ["Google", "Amazon", "Flipkart", "Microsoft"];
  const [company, setCompany] = useState("Amazon");
  const [weeks, setWeeks] = useState(6);
  const [hours, setHours] = useState(2);
  const plan = useMemo(() => {
    const perWeek = Math.max(1, Math.ceil(TOPICS.length / weeks));
    return Array.from({ length: weeks }, (_, w) => ({ week: w + 1, topics: TOPICS.slice(w * perWeek, (w + 1) * perWeek), problems: hours * 5 })).filter((w) => w.topics.length);
  }, [weeks, hours]);
  return (
    <div className={frame}>
      <p className="text-[13px] text-ag-text-faint">Target company</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {companies.map((c) => <button key={c} type="button" aria-pressed={company === c} onClick={() => setCompany(c)} className={chip(company === c)}>{c}</button>)}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-[13px] text-ag-text-faint">
          Weeks left: <span className="text-ag-text">{weeks}</span>
          <input type="range" min={2} max={12} value={weeks} onChange={(e) => setWeeks(+e.target.value)} className="mt-2 w-full accent-ag-accent" />
        </label>
        <label className="block text-[13px] text-ag-text-faint">
          Hours a day: <span className="text-ag-text">{hours}</span>
          <input type="range" min={1} max={6} value={hours} onChange={(e) => setHours(+e.target.value)} className="mt-2 w-full accent-ag-accent" />
        </label>
      </div>
      <ol className="mt-5 max-h-52 space-y-2 overflow-y-auto pr-1" aria-label={`${company} plan`}>
        {plan.map((w) => (
          <li key={w.week} className="flex items-baseline gap-3 rounded-ag-control bg-ag-surface-2 px-3 py-2 text-[13px]">
            <span className="w-14 shrink-0 text-ag-text-faint">Week {w.week}</span>
            <span className="flex-1 text-ag-text">{w.topics.join(" · ")}</span>
            <span className="shrink-0 tabular-nums text-ag-text-faint">{w.problems} problems</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ChecklistDemo() {
  const [known, setKnown] = useState<Set<string>>(new Set(["Arrays & Strings", "Hashing"]));
  const toggle = (t: string) => setKnown((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  const todo = TOPICS.filter((t) => !known.has(t));
  return (
    <div className={frame}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {TOPICS.slice(0, 8).map((t) => (
          <li key={t}>
            <label className={cn("flex cursor-pointer items-center gap-2.5 rounded-ag-control px-2 py-1.5 text-[14px] hover:bg-ag-surface-2", known.has(t) ? "text-ag-text-faint line-through" : "text-ag-text")}>
              <input type="checkbox" checked={known.has(t)} onChange={() => toggle(t)} className="size-4 accent-ag-accent" />
              {t}
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-ag-border pt-4 text-[13px] text-ag-text-muted">
        <span className="text-ag-text">{todo.length} lessons</span> added to your path, each placed just before the problems that need it.
      </p>
    </div>
  );
}

export function RoadmapDemo() {
  const nodes = ["Arrays", "Hashing", "Two pointers", "Binary search", "Trees", "Graphs"];
  const [done, setDone] = useState(2);
  return (
    <div className={frame}>
      <ol className="relative space-y-3">
        {nodes.map((n, i) => {
          const state = i < done ? "done" : i === done ? "current" : "locked";
          return (
            <li key={n} className="relative flex items-center gap-3">
              {i < nodes.length - 1 && <span aria-hidden className={cn("absolute left-[17px] top-9 h-3 w-0.5", i < done ? "bg-ag-accent" : "bg-ag-surface-3")} />}
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border text-[13px]", state === "done" && "border-ag-accent bg-ag-accent-soft text-ag-accent", state === "current" && "border-ag-text text-ag-text", state === "locked" && "border-ag-border text-ag-text-faint")}>
                {state === "done" ? <Check className="size-4" aria-hidden /> : state === "locked" ? <Lock className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn("flex-1 text-[14px]", state === "locked" ? "text-ag-text-faint" : "text-ag-text")}>{n}<span className="sr-only"> ({state})</span></span>
              {state === "current" && (
                <button type="button" onClick={() => setDone((d) => d + 1)} className={cn("rounded-full bg-ag-text px-3 py-1 text-[12px] font-medium text-ag-bg", focusRing)}>Pass the quiz</button>
              )}
            </li>
          );
        })}
      </ol>
      {done >= nodes.length && (
        <button type="button" onClick={() => setDone(2)} className={cn("mt-4 rounded-sm text-[13px] text-ag-text-muted underline underline-offset-4", focusRing)}>Start again</button>
      )}
    </div>
  );
}

const CODE = `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i`;
const CASES = [12, 9, 14, 11, 31, 18];

export function EditorDemo() {
  const [ref, visible] = useVisible<HTMLDivElement>();
  const [lines, setLines] = useState<number>(0);
  const [started, setStarted] = useState(false);
  const running = started && lines < CASES.length;
  useEffect(() => {
    if (!running || !visible) return;
    const t = setTimeout(() => setLines((n) => n + 1), 280);
    return () => clearTimeout(t);
  }, [running, visible, lines]);
  const run = () => { setLines(0); setStarted(true); };
  return (
    <div ref={ref} className={cn(frame, "p-0 sm:p-0")}>
      <div className="flex items-center justify-between border-b border-ag-border px-4 py-2.5">
        <span className="font-geist-mono text-[12px] text-ag-text-faint">solution.py</span>
        <button type="button" onClick={run} disabled={running} className={cn("flex items-center gap-1.5 rounded-full bg-ag-surface-3 px-3 py-1 text-[12px] text-ag-text disabled:opacity-60", focusRing)}>
          <Play className="size-3" aria-hidden /> {running ? "Running…" : "Run"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-geist-mono text-[12.5px] leading-6 text-ag-text-muted"><code>{CODE}</code></pre>
      <div className="min-h-[148px] border-t border-ag-border px-4 py-3 font-geist-mono text-[12px]" aria-live="polite">
        {!started && <p className="text-ag-text-faint">Press Run to check the examples and hidden tests.</p>}
        {CASES.slice(0, lines).map((ms, i) => (
          <p key={i} className="text-ag-text-muted"><span className="text-ag-accent">✓</span> {i < 2 ? `Example ${i + 1}` : `Hidden test ${i - 1}`} · Accepted · {ms} ms</p>
        ))}
        {lines === CASES.length && <p className="mt-1 font-ui text-[13px] font-semibold text-ag-accent">Accepted · 6 / 6 tests passed</p>}
      </div>
    </div>
  );
}

const HINTS = [
  "For each number, which other number would complete the pair?",
  "Checking every pair is O(n²). Can you remember what you've already seen?",
  "Store each value's index in a hash map as you go, and look up target − x before you insert x.",
];

export function HintsDemo() {
  const [open, setOpen] = useState(1);
  return (
    <div className={frame}>
      <ol className="space-y-2">
        {HINTS.map((h, i) => (
          <li key={i} className={cn("rounded-ag-control border px-3 py-2.5 text-[14px]", i < open ? "border-ag-border bg-ag-surface-2 text-ag-text" : "border-dashed border-ag-border text-ag-text-faint")}>
            <span className="mr-2 text-[12px] text-ag-text-faint">Hint {i + 1}</span>
            {i < open ? h : "Hidden until you ask"}
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setOpen((n) => (n >= HINTS.length ? 1 : n + 1))} className={cn("mt-4 rounded-full border border-ag-border-strong px-3 py-1.5 text-[13px] text-ag-text", focusRing)}>
        {open >= HINTS.length ? "Hide hints" : "Show next hint"}
      </button>
    </div>
  );
}
