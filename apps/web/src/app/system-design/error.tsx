"use client";

import Link from "next/link";
import { AppShell } from "@/components/shell/shells";
import { focusRing } from "@/components/shell/ui";
import { primaryAction } from "@/components/system-design/ui";
import { cn } from "@/lib/utils";

export default function SystemDesignError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[560px] px-4 pb-24 pt-20 text-center sm:px-6">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em] text-ag-text">Couldn&rsquo;t load the lessons</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ag-text-muted">Something went wrong on our side, not yours. Try again, or go back to the list of lessons.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={reset} className={primaryAction}>
            Try again
          </button>
          <Link href="/system-design" className={cn("rounded-md text-[15px] text-ag-text-muted hover:text-ag-text active:opacity-80", focusRing)}>
            All lessons
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
