"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { focusRing } from "@/components/shell/ui";
import type { QuizQuestion } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { markLessonDone } from "./progress";

/** End-of-lesson check: pick an option, see at once whether it's right and why. Answering every question marks the lesson done. */
export function Quiz({ slug, questions }: { slug: string; questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const score = picked.filter((p, i) => p === questions[i].answer).length;

  const pick = (q: number, option: number) => {
    const next = picked.map((p, i) => (i === q ? option : p));
    setPicked(next);
    if (next.every((p) => p !== null)) markLessonDone(slug);
  };

  return (
    <div className="mt-6 space-y-4">
      {questions.map((q, qi) => {
        const choice = picked[qi];
        const done = choice !== null;
        return (
          <fieldset key={qi} className="rounded-[20px] border border-ag-border bg-ag-surface-1 p-5 sm:p-6">
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="text-[13px] text-ag-text-faint">Question {qi + 1} of {questions.length}</p>
            <p className="mt-1.5 text-[16px] font-medium leading-snug text-ag-text">{q.question}</p>
            <ul className="mt-4 space-y-2">
              {q.options.map((option, oi) => {
                const correct = oi === q.answer;
                const mine = oi === choice;
                return (
                  <li key={oi}>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => pick(qi, oi)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[14px] leading-snug active:scale-[0.99] disabled:cursor-default disabled:active:scale-100",
                        focusRing,
                        !done && "border-ag-border text-ag-text-muted hover:border-ag-border-strong hover:text-ag-text",
                        done && correct && "border-ag-accent bg-ag-accent-soft text-ag-text",
                        done && mine && !correct && "border-ag-hard text-ag-text",
                        done && !mine && !correct && "border-ag-border text-ag-text-faint",
                      )}
                    >
                      <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-ag-border-strong font-geist-mono text-[11px] text-ag-text-muted">
                        {done && correct ? <Check className="size-3 text-ag-accent" /> : done && mine ? <X className="size-3 text-ag-hard" /> : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {done && (correct || mine) && (
                        <span className={cn("shrink-0 text-[12px] font-medium", correct ? "text-ag-accent" : "text-ag-hard")}>{correct ? (mine ? "Correct" : "Answer") : "Your pick"}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div aria-live="polite">
              {done && <p className="mt-4 border-t border-ag-border pt-4 text-[14px] leading-relaxed text-ag-text-muted">{q.why}</p>}
            </div>
          </fieldset>
        );
      })}

      <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-[14px] text-ag-text-muted">
          {answered < questions.length ? `${answered} of ${questions.length} answered` : `You got ${score} of ${questions.length}. ${score === questions.length ? "Lesson done." : "Lesson done; reread the sections you missed."}`}
        </p>
        {answered > 0 && (
          <button type="button" onClick={() => setPicked(questions.map(() => null))} className={cn("inline-flex h-9 items-center rounded-full border border-ag-border px-4 text-[13px] font-medium text-ag-text-muted hover:text-ag-text active:scale-[0.97]", focusRing)}>
            Start the quiz again
          </button>
        )}
      </div>
    </div>
  );
}
