"use client";

import { AppShell } from "@/components/shell/shells";
import { Button } from "@/components/shell/ui";

export default function InterviewError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 pb-24 pt-16 text-center sm:px-6">
        <h1 className="font-display text-[40px] leading-none text-ag-text">Couldn&rsquo;t load the questions</h1>
        <p className="mt-4 text-base text-ag-text-muted">Something went wrong on our side. Your connection is probably fine. Try again in a moment.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </AppShell>
  );
}
