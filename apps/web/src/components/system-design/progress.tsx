"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/* Which system-design lessons this browser has finished (quiz answered). A per-viewer convenience:
   shortcut: browser storage only, so it doesn't follow the account across devices; move to
   user_topic_progress once the system-design topics are seeded (DECISIONS.md 2026-11-28). */

const KEY = "ag:system-design:done";
const EVENT = "ag-system-design-progress";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): string[] {
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useLessonsDone(): Set<string> {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  return useMemo(() => new Set(parse(raw)), [raw]);
}

export function markLessonDone(slug: string) {
  try {
    const done = new Set(parse(read()));
    if (done.has(slug)) return;
    done.add(slug);
    localStorage.setItem(KEY, JSON.stringify([...done]));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage blocked: progress just isn't remembered */
  }
}

/** "Done" beside a lesson this browser has finished; nothing otherwise. */
export function DoneMark({ slug, className }: { slug: string; className?: string }) {
  const done = useLessonsDone();
  if (!done.has(slug)) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-medium text-ag-accent", className)}>
      <Check className="size-3.5" aria-hidden /> Done
    </span>
  );
}

/** The primary action: the first lesson this browser hasn't finished (lesson 1 before hydration). */
export function NextLessonLink({ lessons, className }: { lessons: { slug: string; title: string }[]; className?: string }) {
  const done = useLessonsDone();
  const next = lessons.find((l) => !done.has(l.slug));
  const started = done.size > 0;
  return (
    <Link href={`/system-design/${(next ?? lessons[0]).slug}`} className={className}>
      {!started ? "Start with lesson 1" : next ? `Continue: ${next.title}` : "Review lesson 1"}
    </Link>
  );
}

/** "3 of 9 lessons done", once at least one is. */
export function TrackProgress({ slugs }: { slugs: string[] }) {
  const done = useLessonsDone();
  const count = slugs.filter((s) => done.has(s)).length;
  if (!count) return null;
  return (
    <div className="mt-6 flex max-w-[360px] items-center gap-3 text-[13px] text-ag-text-muted">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ag-surface-3" role="progressbar" aria-label="Lessons done" aria-valuemin={0} aria-valuemax={slugs.length} aria-valuenow={count}>
        <div className="h-full origin-left rounded-full bg-ag-accent" style={{ transform: `scaleX(${count / slugs.length})` }} />
      </div>
      <span className="tabular-nums">
        {count} of {slugs.length} done
      </span>
    </div>
  );
}
