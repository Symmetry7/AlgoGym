import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { DifficultyChip, focusRing } from "@/components/shell/ui";
import { askedFrequency, topCompanies, type CatalogProblem } from "@/lib/problem-catalog";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "./company-logo";

// Problem | companies | frequency | difficulty. Below md only the title and difficulty stay.
export const rowGrid = "grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-4 md:grid-cols-[20px_minmax(0,1fr)_112px_88px_68px] md:gap-5";

export function ProblemListHeader() {
  return (
    <div aria-hidden className={cn(rowGrid, "hidden h-9 font-ui text-[13px] text-ag-text-faint md:grid")}>
      <span />
      <span>Problem</span>
      <span>Companies</span>
      <span>Frequency</span>
      <span className="text-right">Difficulty</span>
    </div>
  );
}

export function ProblemRow({ p, n, solved, striped, company, companyName, rank }: {
  p: CatalogProblem;
  n: number;
  solved: boolean;
  striped: boolean;
  company?: string;
  companyName: (slug: string) => string;
  rank: Map<string, number>; // company slug -> prominence, so the logos shown are the best-known ones
}) {
  const companies = topCompanies(p, rank);
  const freq = askedFrequency(p, company);
  const label = [p.title, p.difficulty, solved && "solved", p.isPro && "Pro", companies.length && `asked at ${companies.length} ${companies.length === 1 ? "company" : "companies"}`].filter(Boolean).join(", ");
  return (
    <li>
      <Link
        href={`/problems/${p.slug}`}
        aria-label={label}
        className={cn(
          rowGrid,
          "group min-h-11 rounded-[10px] py-2 transition-colors duration-ag-hover ease-ag hover:bg-white/[0.06] active:bg-white/[0.09]",
          striped && "bg-white/[0.025]",
          focusRing,
        )}
      >
        <span className="flex justify-center">
          {solved
            ? <span className="flex size-[18px] items-center justify-center rounded-full bg-ag-accent-soft text-ag-accent"><Check size={12} strokeWidth={3} aria-hidden /></span>
            : <span className="h-px w-2.5 bg-white/15" aria-hidden />}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-ui text-[14px] text-ag-text sm:text-[15px]">
            <span className="mr-1.5 inline-block min-w-[3ch] text-right font-geist-mono text-[13px] text-ag-text-faint">{n}.</span>
            <span className="group-hover:text-white">{p.title}</span>
          </span>
          {p.isPro && <Lock size={13} className="shrink-0 text-ag-pro" aria-hidden />}
        </span>
        <span className="hidden items-center md:flex">
          {companies.length ? (
            <>
              <span className="flex gap-1">
                {companies.slice(0, 3).map((slug) => <CompanyLogo key={slug} slug={slug} name={companyName(slug)} size={22} className="rounded-[6px]" />)}
              </span>
              {companies.length > 3 && <span className="ml-2 font-geist-mono text-[12px] text-ag-text-faint">+{companies.length - 3}</span>}
            </>
          ) : <span aria-hidden className="h-px w-3 bg-white/15" />}
        </span>
        <span className="hidden md:block">
          {freq > 0 ? (
            <span className="block h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <span className="block h-full rounded-full bg-ag-accent" style={{ width: `${Math.max(6, freq)}%` }} />
            </span>
          ) : <span aria-hidden className="block h-px w-3 bg-white/15" />}
        </span>
        <span className="text-right"><DifficultyChip level={p.difficulty} /></span>
      </Link>
    </li>
  );
}
