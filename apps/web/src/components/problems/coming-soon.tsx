import { ArrowLeft, FileClock, Shuffle } from "lucide-react";
import Link from "next/link";
import { DifficultyChip, focusRing } from "@/components/shell/ui";
import { hrefWith, parseCatalogFilters, topCompanies, type CatalogProblem } from "@/lib/problem-catalog";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "./company-logo";

const glassButton = cn("ag-glass-button inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 font-ui text-[15px] font-semibold text-ag-text hover:text-white", focusRing);

/** A catalog problem without a statement yet: what we know (difficulty, who asks it) and where to practise now. Never links out. */
export function ComingSoon({ p, names }: { p: CatalogProblem; names: Map<string, string> }) {
  const companyName = (s: string) => names.get(s) ?? s;
  const companies = topCompanies(p, new Map([...names.keys()].map((s, i) => [s, i])));
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <Link href="/problems" className={cn("inline-flex items-center gap-1.5 rounded-md text-sm text-ag-text-muted hover:text-ag-text", focusRing)}>
        <ArrowLeft size={15} aria-hidden /> All problems
      </Link>
      <h1 className="mt-6 font-display text-[36px] leading-[1.05] text-ag-text sm:text-[48px]">{p.title}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ag-text-muted">
        <DifficultyChip level={p.difficulty} />
        {companies.length > 0 && <span>Asked at {companies.length} {companies.length === 1 ? "company" : "companies"}</span>}
      </p>

      <section className="relative mt-8 overflow-hidden rounded-[20px] border border-white/10 bg-ag-surface-1 p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_75%_0%,var(--ag-light-3),transparent)]" />
        <div className="relative">
          <span className="flex size-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] text-ag-text-muted"><FileClock size={20} aria-hidden /></span>
          <h2 className="mt-5 font-ui text-xl font-semibold text-ag-text">Full statement coming soon</h2>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-ag-text-muted">
            We&rsquo;re writing this one up with examples, hints and tests you can run in the browser.
            {p.similar ? " Until then, a closely related problem is ready to solve." : " Until then, pick another problem to keep your streak going."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {p.similar ? (
              <Link href={`/problems/${p.similar.slug}`} className={glassButton}>
                Solve {p.similar.title}
              </Link>
            ) : (
              <Link href="/problems/shuffle" prefetch={false} className={glassButton}><Shuffle size={16} aria-hidden /> Random problem</Link>
            )}
            <Link href="/problems" className={cn("inline-flex h-11 items-center rounded-[14px] px-3 font-ui text-[15px] text-ag-text-muted hover:text-ag-text", focusRing)}>Browse problems</Link>
          </div>
        </div>
      </section>

      {companies.length > 0 && (
        <section aria-labelledby="asked-h" className="mt-10">
          <h2 id="asked-h" className="font-ui text-sm font-medium text-ag-text-muted">Companies that ask it</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {companies.slice(0, 18).map((slug) => (
              <li key={slug}>
                <Link href={hrefWith(parseCatalogFilters({}), { company: slug })}
                  className={cn("inline-flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] pl-1.5 pr-4 text-sm text-ag-text-muted transition-colors duration-ag-hover ease-ag hover:border-white/20 hover:text-ag-text active:bg-white/[0.06]", focusRing)}>
                  <CompanyLogo slug={slug} name={companyName(slug)} size={28} className="rounded-full" />
                  {companyName(slug)}
                </Link>
              </li>
            ))}
            {companies.length > 18 && <li className="inline-flex h-10 items-center px-2 font-geist-mono text-[13px] text-ag-text-faint">+{companies.length - 18} more</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
