"use client";

import { AppShell } from "@/components/shell/shells";
import { buttonClass } from "@/components/shell/ui";

export default function MyPrepError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col items-center justify-center px-4 text-center" role="alert">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#f0f0f0]">We couldn&rsquo;t load your progress</h1>
        <p className="mt-2 text-[15px] text-[#a1a4a5]">This is usually a brief connection problem. Your progress is safe.</p>
        <button type="button" onClick={reset} className={`${buttonClass("secondary")} mt-6`}>Try again</button>
      </div>
    </AppShell>
  );
}
