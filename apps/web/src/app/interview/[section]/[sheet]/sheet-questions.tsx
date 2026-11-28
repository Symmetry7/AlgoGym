"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button, DifficultyChip, focusRing } from "@/components/shell/ui";
import { filterSheetQuestions, groupByCategory, sheetQuestionHref, type Difficulty, type SheetQuestion } from "@/lib/interview-items";
import { cn } from "@/lib/utils";
import { control, FilterSelect } from "../../interview-browser";

function QuestionRow({ q }: { q: SheetQuestion }) {
  const href = sheetQuestionHref(q);
  const meta = [q.level, q.subcategory].filter(Boolean).join(" · ");
  return (
    <li className="flex flex-col gap-2 border-b border-ag-border px-4 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug text-ag-text">{q.title}</p>
        {(q.difficulty || meta) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ag-text-faint">
            {q.difficulty && <DifficultyChip level={q.difficulty} />}
            {meta && <span>{meta}</span>}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          aria-label={q.practice ? `Practise ${q.title} with the Algogym problem ${q.practice.title}` : `Read our answer to ${q.title}`}
          className={cn(
            "inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-ag-control border border-ag-border-strong px-3 text-[13px] font-medium text-ag-text sm:self-center",
            "transition-colors duration-ag-hover ease-ag hover:bg-ag-surface-3",
            focusRing,
          )}
        >
          {q.practice ? <>Practise: {q.practice.title}</> : "Read our answer"}
          <ArrowRight size={14} aria-hidden />
        </Link>
      )}
    </li>
  );
}

export function SheetQuestions({ questions }: { questions: SheetQuestion[] }) {
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const shown = useMemo(() => filterSheetQuestions(questions, { q, difficulty }), [questions, q, difficulty]);
  const groups = useMemo(() => groupByCategory(shown), [shown]);
  const hasDifficulty = questions.some((x) => x.difficulty);
  const searchId = useId();
  const clear = () => { setQ(""); setDifficulty(undefined); };

  if (!questions.length) {
    return (
      <div className="mt-8 rounded-ag-card border border-ag-border bg-ag-surface-1 px-6 py-14 text-center">
        <p className="text-base text-ag-text">This sheet has no questions yet.</p>
      </div>
    );
  }

  return (
    <section aria-label="Questions" className="mt-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <label htmlFor={searchId} className="mb-1.5 block font-ui text-[13px] text-ag-text-muted">Search</label>
          <div className="relative">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ag-text-faint" />
            <input id={searchId} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this sheet" className={cn(control, "pl-9")} />
          </div>
        </div>
        {hasDifficulty && (
          <FilterSelect label="Difficulty" allLabel="Any difficulty" value={difficulty} onChange={(d) => setDifficulty(d as Difficulty | undefined)} options={["Easy", "Medium", "Hard"].map((d) => ({ value: d, label: d }))} />
        )}
      </div>

      <div className="mt-6 flex min-h-9 items-center justify-between gap-3">
        <p className="text-sm text-ag-text-muted" aria-live="polite">{shown.length === 1 ? "1 question" : `${shown.length} questions`}</p>
        {(q || difficulty) && <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>}
      </div>

      {shown.length ? (
        <div className="mt-3 space-y-6">
          {groups.map((g, i) => (
            <div key={`${g.category}-${i}`}>
              {g.category && <h2 className="mb-2 font-ui text-[13px] font-semibold text-ag-text-muted">{g.category}</h2>}
              <ul className="overflow-hidden rounded-ag-card border border-ag-border bg-ag-surface-1">
                {g.questions.map((x) => <QuestionRow key={x.id} q={x} />)}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-ag-card border border-ag-border bg-ag-surface-1 px-6 py-14 text-center">
          <p className="text-base text-ag-text">No questions match.</p>
          <p className="mt-2 text-sm text-ag-text-muted">Try a broader search, or clear the filters.</p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={clear}>Clear filters</Button>
        </div>
      )}
    </section>
  );
}
