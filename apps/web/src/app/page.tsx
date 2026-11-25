import type { Metadata } from "next";
import { MarketingShell } from "@/components/shell/shells";
import { ButtonLink, Pill } from "@/components/shell/ui";

export const metadata: Metadata = {
  title: "Algogym · Interview prep for developers",
  description: "Algogym is being rebuilt around roadmaps, free lessons and an in-browser coding workspace.",
};

// shortcut: holding page until the real landing page (BUILD_GUIDE M16).
export default function HomePage() {
  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-[1200px] flex-col items-start px-4 pb-[72px] pt-16 sm:px-6 md:pb-[120px] md:pt-28">
        <Pill>Rebuilding in progress</Pill>
        <h1 className="mt-6 font-display text-[44px] leading-none text-ag-text sm:text-[72px] lg:text-[96px]">
          Interview prep
          <br />
          for developers
        </h1>
        <p className="mt-6 max-w-[640px] text-pretty text-base leading-relaxed text-ag-text-muted">
          We&rsquo;re rebuilding Algogym around step-by-step roadmaps, free lessons and a coding workspace in your
          browser. While that&rsquo;s under way, the problem catalog and interview prep are open.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/problems">Browse problems</ButtonLink>
          <ButtonLink href="/interview-preparations" variant="secondary">
            Interview prep
          </ButtonLink>
          <ButtonLink href="/sign-in" variant="ghost" arrow>
            Sign in
          </ButtonLink>
        </div>
      </section>
    </MarketingShell>
  );
}
