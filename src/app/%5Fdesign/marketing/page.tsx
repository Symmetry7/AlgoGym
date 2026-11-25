import type { Metadata } from "next";
import { MarketingShell } from "@/components/shell/shells";
import { ButtonLink, Pill } from "@/components/shell/ui";

export const metadata: Metadata = { title: "Marketing shell · Algogym", robots: { index: false, follow: false } };

/** Shell preview only. The real landing page is M16. */
export default function MarketingPreview() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-[1200px] px-4 pb-[72px] pt-16 sm:px-6 md:pb-[120px] md:pt-24">
        <Pill>New: Company prep 2026 ›</Pill>
        <h1 className="ag-heading-gradient mt-6 font-display text-[44px] leading-none sm:text-[72px] lg:text-[96px]">
          Interview prep
          <br />
          for developers
        </h1>
        <p className="mt-6 max-w-[640px] text-pretty text-base leading-relaxed text-ag-text-muted">
          Learn every topic free, practise real interview questions in your browser, and walk in ready.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/sign-in">Get started</ButtonLink>
          <ButtonLink href="/_design" variant="ghost" arrow>
            Back to design system
          </ButtonLink>
        </div>
        {/* Tall spacer so the nav's scroll state can be checked. */}
        <div aria-hidden className="h-[120vh]" />
      </div>
    </MarketingShell>
  );
}
