"use client";

import { RotateCw } from "lucide-react";
import { AppShell } from "@/components/shell/shells";
import { Button, ButtonLink } from "@/components/shell/ui";

export default function ProblemsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-[560px] flex-col items-center justify-center px-4 pb-24 text-center sm:px-6">
        <h1 className="font-display text-[40px] leading-none text-ag-text sm:text-[48px]">Couldn&rsquo;t load problems</h1>
        <p className="mt-4 text-base leading-relaxed text-ag-text-muted">Something went wrong on our side, and your progress is safe. Try again in a moment.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}><RotateCw size={16} aria-hidden /> Try again</Button>
          <ButtonLink href="/my-prep" variant="secondary">Go to My Prep</ButtonLink>
        </div>
      </div>
    </AppShell>
  );
}
