"use client";

import { Check, ChevronDown, Copy, Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { SegmentedTabs } from "@/components/shell/segmented-tabs";
import { Button, DifficultyChip, focusRing } from "@/components/shell/ui";
import { answerParts, filterItems, filterOptions, type InterviewFilters, type InterviewItem } from "@/lib/interview-items";
import { cn } from "@/lib/utils";

const KIND_LABEL = { hr: "HR", sql: "SQL" } as const;
const titleCase = (slug: string) => slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

export const control = cn(
  "h-11 w-full rounded-ag-control border border-ag-border-strong bg-ag-surface-2 px-3 font-ui text-sm text-ag-text",
  "placeholder:text-ag-text-faint",
  focusRing,
);

export function FilterSelect({ label, value, onChange, options, allLabel }: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  options: { value: string; label: string; n?: number }[];
  allLabel: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block font-ui text-[13px] text-ag-text-muted">{label}</label>
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className={control}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.n === undefined ? o.label : `${o.label} (${o.n})`}</option>
        ))}
      </select>
    </div>
  );
}

function Answer({ item }: { item: InterviewItem }) {
  const [copied, setCopied] = useState<"idle" | "done" | "error">("idle");
  if (!item.answer_md) return <p className="text-sm text-ag-text-muted">This answer isn&rsquo;t available yet.</p>;
  return (
    <div className="space-y-3">
      {answerParts(item.answer_md).map((part, i) =>
        part.type === "text" ? (
          <p key={i} className="whitespace-pre-line text-[15px] leading-[1.65] text-ag-text">{part.value}</p>
        ) : (
          <div key={i} className="overflow-hidden rounded-ag-control border border-ag-border bg-ag-bg-app">
            <div className="flex items-center justify-between border-b border-ag-border px-3 py-2">
              <span className="font-geist-mono text-xs text-ag-text-faint">query.sql · MySQL 8</span>
              <button
                type="button"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(part.value); setCopied("done"); } catch { setCopied("error"); }
                }}
                className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 font-ui text-xs text-ag-text-muted hover:text-ag-text", focusRing)}
              >
                {copied === "done" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                {copied === "done" ? "Copied" : copied === "error" ? "Couldn’t copy" : "Copy query"}
              </button>
            </div>
            <pre className="overflow-x-auto p-3 font-geist-mono text-[13px] leading-relaxed text-ag-text"><code>{part.value}</code></pre>
          </div>
        ),
      )}
      <p className="text-[13px] text-ag-text-faint">
        {item.kind === "hr"
          ? "Replace the bracketed parts with your own true details before you use this answer."
          : "The tables and columns are illustrative. Adapt them to the schema you're given."}
      </p>
    </div>
  );
}

function Row({ item, defaultOpen = false }: { item: InterviewItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panel = useId();
  return (
    <li className="border-b border-ag-border last:border-b-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen((o) => !o)}
          className={cn("flex w-full items-start gap-3 px-4 py-4 text-left transition-colors duration-ag-hover ease-ag hover:bg-ag-surface-2 sm:px-5", focusRing, "focus-visible:ring-inset focus-visible:ring-offset-0")}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium leading-snug text-ag-text">{item.question}</span>
            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ag-text-faint">
              <span className="rounded-full bg-ag-surface-3 px-2 py-0.5 font-medium text-ag-text-muted">{KIND_LABEL[item.kind]}</span>
              {item.difficulty && <DifficultyChip level={item.difficulty} />}
              {item.tags.slice(0, 2).map((t) => <span key={t}>{t}</span>)}
            </span>
          </span>
          <ChevronDown size={18} aria-hidden className={cn("mt-0.5 shrink-0 text-ag-text-faint transition-transform duration-ag-hover ease-ag motion-reduce:transition-none", open && "rotate-180")} />
        </button>
      </h2>
      <div id={panel} hidden={!open} className="px-4 pb-5 sm:px-5">
        {open && <Answer item={item} />}
      </div>
    </li>
  );
}

export function InterviewBrowser({ items, initial }: { items: InterviewItem[]; initial: InterviewFilters }) {
  const [f, setF] = useState<InterviewFilters>(initial);
  const set = (patch: Partial<InterviewFilters>) => setF((prev) => ({ ...prev, ...patch }));

  // Keep the URL shareable without a server round trip.
  useEffect(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v && !(k === "kind" && v === "all")) p.set(k, v);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [f]);

  const options = useMemo(() => filterOptions(items, f.kind), [items, f.kind]);
  const shown = useMemo(() => filterItems(items, f), [items, f]);
  const counts = useMemo(() => ({ all: items.length, hr: items.filter((i) => i.kind === "hr").length, sql: items.filter((i) => i.kind === "sql").length }), [items]);
  const filtered = Boolean(f.topic || f.company || f.role || f.difficulty || f.q);
  const searchId = useId();

  return (
    <section aria-label="Questions" className="mt-6">
      <SegmentedTabs
        label="Question type"
        value={f.kind}
        // A topic from one kind rarely exists in the other, so switching kind clears it.
        onChange={(kind) => set({ kind, topic: undefined })}
        options={[
          { value: "all", label: <>All <span className="text-ag-text-faint">{counts.all}</span></> },
          { value: "hr", label: <>HR <span className="text-ag-text-faint">{counts.hr}</span></> },
          { value: "sql", label: <>SQL <span className="text-ag-text-faint">{counts.sql}</span></> },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor={searchId} className="mb-1.5 block font-ui text-[13px] text-ag-text-muted">Search</label>
          <div className="relative">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ag-text-faint" />
            <input id={searchId} type="search" value={f.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Search questions and answers" className={cn(control, "pl-9")} />
          </div>
        </div>
        <FilterSelect label="Topic" allLabel="All topics" value={f.topic} onChange={(topic) => set({ topic })} options={options.topics.map((o) => ({ value: o.value, label: o.value, n: o.n }))} />
        <FilterSelect label="Difficulty" allLabel="Any difficulty" value={f.difficulty} onChange={(d) => set({ difficulty: d as InterviewFilters["difficulty"] })} options={["Easy", "Medium", "Hard"].map((d) => ({ value: d, label: d }))} />
        {/* Company and role tags come from the source content; a filter with nothing to offer is hidden rather than shown empty. */}
        {options.companies.length > 0 && (
          <FilterSelect label="Company" allLabel="All companies" value={f.company} onChange={(company) => set({ company })} options={options.companies.map((o) => ({ value: o.value, label: titleCase(o.value), n: o.n }))} />
        )}
        {options.roles.length > 0 && (
          <FilterSelect label="Role" allLabel="All roles" value={f.role} onChange={(role) => set({ role })} options={options.roles.map((o) => ({ value: o.value, label: titleCase(o.value), n: o.n }))} />
        )}
      </div>

      <div className="mt-6 flex min-h-9 items-center justify-between gap-3">
        <p className="text-sm text-ag-text-muted" aria-live="polite">
          {shown.length === 1 ? "1 question" : `${shown.length} questions`}
        </p>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => setF({ kind: f.kind })}>Clear filters</Button>
        )}
      </div>

      {shown.length ? (
        <ul className="mt-3 overflow-hidden rounded-ag-card border border-ag-border bg-ag-surface-1">
          {/* A link from a question sheet lands on one item: open it. */}
          {shown.map((item) => <Row key={item.id} item={item} defaultOpen={shown.length === 1} />)}
        </ul>
      ) : (
        <div className="mt-3 rounded-ag-card border border-ag-border bg-ag-surface-1 px-6 py-14 text-center">
          <p className="text-base text-ag-text">No questions match these filters.</p>
          <p className="mt-2 text-sm text-ag-text-muted">Try a broader search, or clear the filters to see every question.</p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={() => setF({ kind: f.kind })}>Clear filters</Button>
        </div>
      )}
    </section>
  );
}
