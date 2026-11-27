"use client";

import {
  ArrowLeft, BookOpen, ChevronDown, FileText, History, Lightbulb, ListChecks, Lock, PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen, Play, RotateCcw, Terminal, TextCursorInput,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ButtonLink, DifficultyChip, focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { LANGS, clampSplit, draftKey, formatInput, parseInput, type Lang } from "@/lib/workspace";

// Monaco stays out of every other page's bundle (BUILD_GUIDE M9).
const CodeEditor = dynamic(() => import("./code-editor"), { ssr: false, loading: () => <p className="p-4 text-sm text-ag-text-faint">Loading editor…</p> });

export interface WorkspaceData {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  locked: boolean;
  params: { name: string; type: string }[];
  examples: { input: unknown[]; output: unknown; explain: string | null }[];
  hints: string[];
  hasEditorial: boolean;
  starters: Partial<Record<Lang, string>>;
}

type Mode = "wide" | "medium" | "narrow";
const queries = { wide: "(min-width: 1280px)", medium: "(min-width: 768px)" };
function useMode(): Mode {
  return useSyncExternalStore(
    (cb) => {
      const lists = Object.values(queries).map((q) => window.matchMedia(q));
      lists.forEach((l) => l.addEventListener("change", cb));
      return () => lists.forEach((l) => l.removeEventListener("change", cb));
    },
    () => (window.matchMedia(queries.wide).matches ? "wide" : window.matchMedia(queries.medium).matches ? "medium" : "narrow"),
    () => "wide",
  );
}

// localStorage as an external store: hydration-safe (the server snapshot is null) and no setState in effects.
const STORE_EVENT = "algogym:store";
function useStored(key: string): string | null {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      window.addEventListener(STORE_EVENT, cb);
      return () => { window.removeEventListener("storage", cb); window.removeEventListener(STORE_EVENT, cb); };
    },
    () => store.get(key),
    () => null,
  );
}

const store = {
  get(key: string) { try { return window.localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { window.localStorage.setItem(key, value); } catch { /* private mode: drafts just don't persist */ } window.dispatchEvent(new Event(STORE_EVENT)); },
  remove(key: string) { try { window.localStorage.removeItem(key); } catch { /* ignore */ } window.dispatchEvent(new Event(STORE_EVENT)); },
};

const panel = "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-ag-border bg-ag-surface-1";
// Thin, dark scrollbars inside panels (Firefox and Chromium).
const scroll = "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.14)_transparent]";

function Tabs<T extends string>({ label, tabs, value, onChange }: { label: string; tabs: { id: T; label: string; icon: ReactNode; locked?: boolean }[]; value: T; onChange: (t: T) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const key = (e: KeyboardEvent, i: number) => {
    const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next].id);
  };
  return (
    <div role="tablist" aria-label={label} className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t, i) => (
        <button
          key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)} onKeyDown={(e) => key(e, i)}
          className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-t-xl px-3 text-[13px] font-medium", focusRing, "focus-visible:ring-offset-0",
            value === t.id ? "bg-white/5 text-ag-text" : "text-ag-text-muted hover:text-ag-text")}
        >
          {t.icon}{t.label}{t.locked && <Lock size={12} className="text-ag-pro" aria-label="Pro" />}
        </button>
      ))}
    </div>
  );
}

/** A 12 px gap that resizes the panels on either side: drag it, or focus it and use the arrow keys. */
function Splitter({ orientation, label, onDelta }: { orientation: "vertical" | "horizontal"; label: string; onDelta: (px: number) => void }) {
  const last = useRef<number | null>(null);
  const axis = orientation === "vertical" ? "clientX" : "clientY";
  return (
    <div
      role="separator" aria-orientation={orientation} aria-label={label} tabIndex={0}
      onPointerDown={(e: PointerEvent) => { last.current = e[axis]; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e: PointerEvent) => { if (last.current === null) return; onDelta(e[axis] - last.current); last.current = e[axis]; }}
      onPointerUp={() => { last.current = null; }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 64 : 16;
        const d = { ArrowLeft: -step, ArrowUp: -step, ArrowRight: step, ArrowDown: step }[e.key];
        if (d !== undefined) { e.preventDefault(); onDelta(d); }
      }}
      className={cn("group relative shrink-0 touch-none outline-none", orientation === "vertical" ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize")}
    >
      <span className={cn("absolute rounded-full bg-transparent transition-colors duration-ag-hover group-hover:bg-ag-border-strong group-focus-visible:bg-ag-accent",
        orientation === "vertical" ? "inset-y-6 left-[5px] w-0.5" : "inset-x-6 top-[5px] h-0.5")} />
    </div>
  );
}

function Rail({ label, side, onOpen }: { label: string; side: "left" | "right"; onOpen: () => void }) {
  const Icon = side === "left" ? PanelLeftOpen : PanelRightOpen;
  return (
    <button type="button" onClick={onOpen} aria-label={`Show ${label}`} title={`Show ${label}`}
      className={cn(panel, "w-11 shrink-0 items-center gap-3 py-3 text-ag-text-muted hover:text-ag-text", focusRing)}>
      <Icon size={18} aria-hidden />
      <span className="text-[13px] [writing-mode:vertical-rl]">{label}</span>
    </button>
  );
}

export function Workspace({ data, statement }: { data: WorkspaceData; statement: ReactNode }) {
  const mode = useMode();
  const storedLang = useStored("algogym:lang");
  const lang: Lang = LANGS.some((l) => l.id === storedLang) ? (storedLang as Lang) : "python";
  const storedSplit = useStored("algogym:split");
  const [code, setCode] = useState<Partial<Record<Lang, string>>>({}); // this session's edits, per language
  const [saved, setSaved] = useState(true);
  const [problemTab, setProblemTab] = useState<"description" | "hints" | "editorial" | "submissions">("description");
  const [resultTab, setResultTab] = useState<"output" | "input" | "tests">("output");
  const [mobileTab, setMobileTab] = useState<"problem" | "code" | "result">("problem");
  const split = useMemo(() => {
    try { const s = JSON.parse(storedSplit ?? "null"); if (Array.isArray(s) && s.length === 3 && s.every((v) => typeof v === "number")) return clampSplit(s); } catch { /* ignore */ }
    return [0.34, 0.41, 0.25];
  }, [storedSplit]);
  const [dock, setDock] = useState(0.35);
  const [collapsed, setCollapsed] = useState({ problem: false, result: false });
  const [output, setOutput] = useState<{ kind: "idle" | "run" | "submit"; at?: string }>({ kind: "idle" });
  const [input, setInput] = useState(data.examples[0] ? formatInput(data.params, data.examples[0].input) : "");
  const [openHint, setOpenHint] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const langId = useId();
  const meta = LANGS.find((l) => l.id === lang)!;
  const parsed = useMemo(() => parseInput(data.params, input), [data.params, input]);

  // The editor shows this session's edits, else the saved draft, else the generated starter.
  const storedDraft = useStored(draftKey(data.slug, lang));
  const current = code[lang] ?? storedDraft ?? data.starters[lang] ?? "";

  // Autosave the draft, debounced.
  useEffect(() => {
    if (code[lang] === undefined) return;
    const t = setTimeout(() => {
      if (code[lang] === (data.starters[lang] ?? "")) store.remove(draftKey(data.slug, lang));
      else store.set(draftKey(data.slug, lang), code[lang]!);
      setSaved(true);
    }, 400);
    return () => clearTimeout(t);
  }, [code, lang, data.slug, data.starters]);

  const run = useCallback(() => {
    if (data.locked) return;
    setOutput({ kind: "run", at: new Date().toLocaleTimeString("en-IN") });
    setResultTab("output");
    setCollapsed((c) => ({ ...c, result: false }));
    setMobileTab("result");
  }, [data.locked]);
  const submit = useCallback(() => {
    if (data.locked) return;
    setOutput({ kind: "submit", at: new Date().toLocaleTimeString("en-IN") });
    setResultTab("tests");
    setCollapsed((c) => ({ ...c, result: false }));
    setMobileTab("result");
  }, [data.locked]);

  // Ctrl+Enter runs and Ctrl+Shift+Enter submits from anywhere on the page (Monaco handles its own focus).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "Enter") return;
      e.preventDefault();
      if (e.shiftKey) submit(); else run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, submit]);

  const resizeColumns = (i: number, px: number) => {
    const next = [...split];
    const d = px / (row.current?.clientWidth ?? 1);
    next[i] += d;
    next[i + 1] -= d;
    store.set("algogym:split", JSON.stringify(clampSplit(next)));
  };

  const changeLang = (l: Lang) => { store.set("algogym:lang", l); setConfirmReset(false); };

  // ── Panels ──
  const problemPanel = (
    <section aria-label="Problem" className={cn(panel, "h-full")}>
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <Tabs<typeof problemTab> label="Problem" value={problemTab} onChange={setProblemTab} tabs={[
          { id: "description", label: "Description", icon: <FileText size={15} aria-hidden /> },
          { id: "hints", label: "Hints", icon: <Lightbulb size={15} aria-hidden /> },
          { id: "editorial", label: "Editorial", icon: <BookOpen size={15} aria-hidden />, locked: true },
          { id: "submissions", label: "Submissions", icon: <History size={15} aria-hidden /> },
        ]} />
        {mode !== "narrow" && (
          <button type="button" onClick={() => setCollapsed((c) => ({ ...c, problem: true }))} aria-label="Hide the problem panel" title="Hide the problem panel" className={cn("rounded-md p-1.5 text-ag-text-faint hover:text-ag-text", focusRing)}>
            <PanelLeftClose size={16} aria-hidden />
          </button>
        )}
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto border-t border-ag-border px-5 py-5", scroll)}>
        {problemTab === "description" && (
          <>
            <h1 className="font-ui text-xl font-semibold text-ag-text">{data.title}</h1>
            <div className="mt-2"><DifficultyChip level={data.difficulty} /></div>
            <div className={cn("relative mt-4", data.locked && "max-h-48 overflow-hidden")}>
              {statement}
              {data.locked && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ag-surface-1 to-transparent backdrop-blur-[2px]" />}
            </div>
            {data.locked ? (
              <div className="mt-4 rounded-2xl border border-ag-border bg-ag-surface-2 p-5 text-center">
                <Lock className="mx-auto text-ag-pro" aria-hidden />
                <p className="mt-3 text-[15px] text-ag-text">This problem is part of Pro.</p>
                <p className="mt-1 text-sm text-ag-text-muted">Pro unlocks the full statement, the editor and the editorial.</p>
                <ButtonLink href="/pricing" size="sm" className="mt-4">See Pro</ButtonLink>
              </div>
            ) : (
              data.examples.map((e, i) => (
                <div key={i} className="mt-5">
                  <p className="text-[13px] font-semibold text-ag-text">Example {i + 1}</p>
                  <dl className="mt-2 space-y-1 overflow-x-auto rounded-xl bg-ag-surface-2 p-3 font-geist-mono text-[13px] text-ag-text">
                    {data.params.map((p, k) => <div key={p.name} className="flex gap-2"><dt className="text-ag-text-faint">{p.name} =</dt><dd className="whitespace-pre">{JSON.stringify(e.input[k])}</dd></div>)}
                    <div className="flex gap-2"><dt className="text-ag-text-faint">returns</dt><dd className="whitespace-pre">{JSON.stringify(e.output)}</dd></div>
                  </dl>
                  {e.explain && <p className="mt-2 text-sm leading-relaxed text-ag-text-muted">{e.explain}</p>}
                </div>
              ))
            )}
          </>
        )}
        {problemTab === "hints" && (
          data.locked || !data.hints.length ? <p className="text-sm text-ag-text-muted">{data.locked ? "Hints are part of Pro for this problem." : "This problem has no hints yet."}</p> : (
            <ol className="space-y-2">
              {data.hints.map((h, i) => (
                <li key={i} className="rounded-xl border border-ag-border">
                  <button type="button" aria-expanded={openHint > i} disabled={i > openHint} onClick={() => setOpenHint(openHint > i ? i : i + 1)}
                    className={cn("flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ag-text disabled:text-ag-text-faint", focusRing, "focus-visible:ring-offset-0")}>
                    Hint {i + 1}{i > openHint && <span className="text-[12px] font-normal"> · open hint {i} first</span>}
                    <ChevronDown size={16} aria-hidden className={cn("transition-transform duration-ag-hover motion-reduce:transition-none", openHint > i && "rotate-180")} />
                  </button>
                  {openHint > i && <p className="border-t border-ag-border px-4 py-3 text-sm leading-relaxed text-ag-text-muted">{h}</p>}
                </li>
              ))}
            </ol>
          )
        )}
        {problemTab === "editorial" && (
          <div className="rounded-2xl border border-ag-border bg-ag-surface-2 p-5 text-center">
            <Lock className="mx-auto text-ag-pro" aria-hidden />
            <p className="mt-3 text-[15px] text-ag-text">{data.hasEditorial ? "The editorial and 4-language solutions are part of Pro." : "The editorial for this problem is on its way."}</p>
            {data.hasEditorial && <ButtonLink href="/pricing" size="sm" className="mt-4">See Pro</ButtonLink>}
          </div>
        )}
        {problemTab === "submissions" && <p className="text-sm text-ag-text-muted">Your submissions will appear here once you can submit.</p>}
      </div>
    </section>
  );

  const editorPanel = (
    <section aria-label="Code editor" className={cn(panel, "h-full")}>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-ag-border px-4">
        <span className="font-geist-mono text-[12px] text-ag-text-faint">{meta.file}</span>
        {!data.locked && (
          <span className="flex items-center gap-3 text-[12px] text-ag-text-faint">
            <span aria-live="polite">{saved ? "Saved in this browser" : "Saving…"}</span>
            <button type="button" onClick={() => {
              if (!confirmReset) { setConfirmReset(true); return; }
              setCode((c) => ({ ...c, [lang]: data.starters[lang] ?? "" }));
              store.remove(draftKey(data.slug, lang));
              setConfirmReset(false);
            }} className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:text-ag-text", confirmReset && "text-ag-hard", focusRing)}>
              <RotateCcw size={13} aria-hidden />{confirmReset ? "Discard your code?" : "Reset"}
            </button>
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {data.locked ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <Lock className="text-ag-pro" aria-hidden />
            <p className="text-[15px] text-ag-text">The editor opens with Pro for this problem.</p>
            <ButtonLink href="/problems?access=free" variant="secondary" size="sm">Browse free problems</ButtonLink>
          </div>
        ) : (
          <CodeEditor
            value={current} language={meta.monaco} label={`${meta.name} solution for ${data.title}`}
            onChange={(v) => { setCode((c) => ({ ...c, [lang]: v })); setSaved(false); setConfirmReset(false); }}
            onRun={run} onSubmit={submit}
          />
        )}
      </div>
    </section>
  );

  const resultPanel = (
    <section aria-label="Results" className={cn(panel, "h-full")}>
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <Tabs<typeof resultTab> label="Results" value={resultTab} onChange={setResultTab} tabs={[
          { id: "output", label: "Output", icon: <Terminal size={15} aria-hidden /> },
          { id: "input", label: "Input", icon: <TextCursorInput size={15} aria-hidden /> },
          { id: "tests", label: "Tests", icon: <ListChecks size={15} aria-hidden /> },
        ]} />
        {mode === "wide" && (
          <button type="button" onClick={() => setCollapsed((c) => ({ ...c, result: true }))} aria-label="Hide the results panel" title="Hide the results panel" className={cn("rounded-md p-1.5 text-ag-text-faint hover:text-ag-text", focusRing)}>
            <PanelRightClose size={16} aria-hidden />
          </button>
        )}
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto border-t border-ag-border p-4 text-[13px]", scroll)} aria-live="polite">
        {resultTab === "output" && (output.kind === "idle"
          ? <p className="text-pretty text-ag-text-faint">Run your code to see output. Ctrl+Enter works too.</p>
          : <div className="space-y-2 text-ag-text-muted">
              <p className="text-ag-text">{output.kind === "run" ? "Run" : "Submit"} · {output.at}</p>
              <p>Running code isn&rsquo;t switched on yet: the judge arrives in the next update. Your code is saved in this browser, so nothing is lost.</p>
              {output.kind === "run" && ("error" in parsed ? <p className="text-ag-hard">Input: {parsed.error}</p> : <p>Input is valid and ready: {data.params.map((p) => p.name).join(", ")}.</p>)}
            </div>)}
        {resultTab === "input" && (
          <div>
            <label htmlFor={`${langId}-input`} className="block text-[13px] text-ag-text-muted">Custom input, one <span className="font-geist-mono">name = value</span> per line</label>
            <textarea id={`${langId}-input`} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} rows={Math.max(3, data.params.length + 1)}
              className={cn("mt-2 w-full resize-y rounded-xl border border-ag-border-strong bg-ag-surface-2 p-3 font-geist-mono text-ag-text", focusRing)} />
            <p className={cn("mt-2 text-[13px]", "error" in parsed ? "text-ag-hard" : "text-ag-text-faint")}>
              {"error" in parsed ? parsed.error : "Edit an example above to try your own input."}
            </p>
            {data.examples.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2 font-ui">
                {data.examples.map((e, i) => (
                  <button key={i} type="button" onClick={() => setInput(formatInput(data.params, e.input))} className={cn("rounded-full bg-ag-surface-3 px-3 py-1 text-[12px] text-ag-text-muted hover:text-ag-text", focusRing)}>Example {i + 1}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {resultTab === "tests" && (
          <div className="font-ui">
            <p className="text-pretty text-[13px] text-ag-text-faint">{output.kind === "submit" ? "Submitting checks every hidden test once the judge is on." : "Submit to check every hidden test. Ctrl+Shift+Enter works too."}</p>
            <ul className="mt-3 space-y-2">
              {data.examples.map((e, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px] text-ag-text-muted">
                  <span className="size-2 rounded-full bg-ag-surface-3" aria-hidden /> Example {i + 1} <span className="text-ag-text-faint">· not run</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );

  // ── Top bar ──
  const topBar = (
    <header className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-ag-border bg-ag-surface-1 px-2 sm:gap-3">
      <Link href="/problems" aria-label="Back to problems" className={cn("rounded-lg p-2 text-ag-text-muted hover:text-ag-text", focusRing)}><ArrowLeft size={18} aria-hidden /></Link>
      <p className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-[15px] font-semibold text-ag-text">{data.title}</span>
        <span className="hidden truncate font-geist-mono text-[12px] text-ag-text-faint sm:inline">{data.slug}</span>
      </p>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {!data.locked && (
          <span className="relative inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-ag-text hover:bg-white/5">
            <label htmlFor={langId} className="sr-only">Language</label>
            <span aria-hidden>{meta.name} <span className="text-ag-text-faint">{meta.version}</span></span>
            <ChevronDown size={14} aria-hidden className="text-ag-text-faint" />
            {/* A native select over the label: custom look, built-in keyboard and screen-reader support. */}
            <select id={langId} value={lang} onChange={(e) => changeLang(e.target.value as Lang)} className={cn("absolute inset-0 cursor-pointer rounded-full opacity-0", focusRing)}>
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name} {l.version}</option>)}
            </select>
          </span>
        )}
        <button type="button" onClick={run} disabled={data.locked} title="Run (Ctrl+Enter)"
          className={cn("inline-flex h-9 items-center gap-2 rounded-full bg-ag-text pl-4 pr-1 text-sm font-semibold text-ag-bg transition-opacity hover:opacity-90 disabled:opacity-40", focusRing)}>
          Run <span className="flex size-7 items-center justify-center rounded-full bg-ag-bg"><Play size={12} className="fill-ag-text text-ag-text" aria-hidden /></span>
        </button>
        <button type="button" onClick={submit} disabled={data.locked} title="Submit (Ctrl+Shift+Enter)"
          className={cn("inline-flex h-9 items-center rounded-full bg-ag-accent px-4 text-sm font-semibold text-ag-on-accent hover:bg-ag-accent-hover disabled:opacity-40", focusRing)}>
          Submit
        </button>
      </div>
    </header>
  );

  // ── Layouts (DESIGN.md §6.6) ──
  let body: ReactNode;
  if (mode === "narrow") {
    body = (
      <>
        <div role="tablist" aria-label="Workspace" className="flex shrink-0 gap-1 rounded-2xl border border-ag-border bg-ag-surface-1 p-1">
          {(["problem", "code", "result"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={mobileTab === t} onClick={() => setMobileTab(t)}
              className={cn("h-9 flex-1 rounded-xl text-sm font-medium capitalize", mobileTab === t ? "bg-ag-surface-3 text-ag-text" : "text-ag-text-muted", focusRing)}>
              {t}
            </button>
          ))}
        </div>
        {/* All three stay mounted so switching tabs never tears down the editor. */}
        <div className={cn("min-h-0 flex-1", mobileTab !== "problem" && "hidden")}>{problemPanel}</div>
        <div className={cn("min-h-0 flex-1", mobileTab !== "code" && "hidden")}>{editorPanel}</div>
        <div className={cn("min-h-0 flex-1", mobileTab !== "result" && "hidden")}>{resultPanel}</div>
      </>
    );
  } else if (mode === "medium") {
    const [left] = split;
    body = (
      <div ref={row} className="flex min-h-0 flex-1">
        {collapsed.problem ? <Rail label="Problem" side="left" onOpen={() => setCollapsed((c) => ({ ...c, problem: false }))} /> : <div className="min-w-0" style={{ flexBasis: `${left * 100}%` }}>{problemPanel}</div>}
        {!collapsed.problem && <Splitter orientation="vertical" label="Resize the problem panel" onDelta={(px) => resizeColumns(0, px)} />}
        <div ref={column} className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0" style={{ flexBasis: `${(1 - dock) * 100}%` }}>{editorPanel}</div>
          <Splitter orientation="horizontal" label="Resize the results panel" onDelta={(px) => setDock((d) => Math.min(0.7, Math.max(0.2, d - px / (column.current?.clientHeight ?? 1))))} />
          <div className="min-h-0 flex-1">{resultPanel}</div>
        </div>
      </div>
    );
  } else {
    body = (
      <div ref={row} className="flex min-h-0 flex-1">
        {collapsed.problem ? <Rail label="Problem" side="left" onOpen={() => setCollapsed((c) => ({ ...c, problem: false }))} /> : <div className="min-w-0" style={{ flexBasis: `${split[0] * 100}%` }}>{problemPanel}</div>}
        {!collapsed.problem && <Splitter orientation="vertical" label="Resize the problem panel" onDelta={(px) => resizeColumns(0, px)} />}
        <div className="min-w-0 flex-1">{editorPanel}</div>
        {!collapsed.result && <Splitter orientation="vertical" label="Resize the results panel" onDelta={(px) => resizeColumns(1, px)} />}
        {collapsed.result ? <Rail label="Results" side="right" onOpen={() => setCollapsed((c) => ({ ...c, result: false }))} /> : <div className="min-w-0" style={{ flexBasis: `${split[2] * 100}%` }}>{resultPanel}</div>}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col gap-3 bg-ag-bg-app p-3 font-ui text-ag-text antialiased">
      {topBar}
      {body}
    </div>
  );
}
