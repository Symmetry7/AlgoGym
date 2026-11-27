"use client";

import { Search, Shuffle, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { buttonClass, focusRing } from "@/components/shell/ui";
import { hrefWith, type CatalogFilters } from "@/lib/problem-catalog";
import { cn } from "@/lib/utils";
import { Drawer } from "./drawer";

const control = cn("h-10 w-full rounded-ag-control border border-ag-border-strong bg-ag-surface-2 px-3 font-ui text-sm text-ag-text", focusRing);

function Select({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-ag-text-muted">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={control}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

/** "X / Y solved" ring; links to sign-in for visitors. */
function SolvedRing({ signedIn, solved, total }: { signedIn: boolean; solved: number; total: number }) {
  const r = 14, c = 2 * Math.PI * r, share = total ? solved / total : 0;
  const ring = (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="-rotate-90">
      <circle cx="17" cy="17" r={r} fill="none" strokeWidth="2" className="stroke-ag-surface-3" />
      <circle cx="17" cy="17" r={r} fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-ag-accent" strokeDasharray={`${c * share} ${c}`} />
    </svg>
  );
  const label = <span className="text-[13px] leading-tight"><span className="block text-ag-text">{solved} / {total}</span><span className="text-ag-text-faint">solved</span></span>;
  return signedIn ? (
    <div className="flex items-center gap-2" aria-label={`${solved} of ${total} Algogym problems solved`}>{ring}{label}</div>
  ) : (
    <Link href="/sign-in" className={cn("flex items-center gap-2 rounded-ag-control pr-1", focusRing)} title="Sign in to track what you solve">{ring}{label}</Link>
  );
}

export function Toolbar({ filters, companies, tags, sidebar, progress }: {
  filters: CatalogFilters;
  companies: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
  /** Lists and sidebar cards, shown in a drawer below the xl breakpoint. */
  sidebar: ReactNode;
  progress: { signedIn: boolean; solved: number; total: number };
}) {
  const router = useRouter();
  const go = (patch: Partial<CatalogFilters>) => router.push(hrefWith(filters, patch), { scroll: false });
  const [q, setQ] = useState(filters.q ?? "");
  const searchId = useId();
  const typed = useRef(false);

  // Debounced search; only after the user types, so back/forward navigation isn't overwritten.
  useEffect(() => {
    if (!typed.current) return;
    const t = setTimeout(() => router.replace(hrefWith(filters, { q: q.trim() || undefined }), { scroll: false }), 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps -- filters come from the URL this effect writes

  const companyName = (s: string) => companies.find((c) => c.slug === s)?.name ?? s;
  const tagName = (s: string) => tags.find((t) => t.slug === s)?.name ?? s;
  const chips: [string, Partial<CatalogFilters>][] = [
    ...(filters.difficulty ? [[filters.difficulty, { difficulty: undefined }] as [string, Partial<CatalogFilters>]] : []),
    ...(filters.source ? [[filters.source === "algogym" ? "Algogym originals" : "LeetCode", { source: undefined }] as [string, Partial<CatalogFilters>]] : []),
    ...(filters.access ? [[filters.access === "pro" ? "Pro" : "Free", { access: undefined }] as [string, Partial<CatalogFilters>]] : []),
    ...(filters.company ? [[companyName(filters.company), { company: undefined }] as [string, Partial<CatalogFilters>]] : []),
    ...(filters.tag ? [[tagName(filters.tag), { tag: undefined }] as [string, Partial<CatalogFilters>]] : []),
    ...(filters.status ? [[filters.status === "solved" ? "Solved" : "Not solved", { status: undefined }] as [string, Partial<CatalogFilters>]] : []),
  ];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <label htmlFor={searchId} className="sr-only">Search problems</label>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ag-text-faint" />
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => { typed.current = true; setQ(e.target.value); }}
            placeholder="Search by title"
            className={cn(control, "pl-9")}
          />
        </div>
        <label className="sr-only" htmlFor={`${searchId}-sort`}>Sort</label>
        <select id={`${searchId}-sort`} value={filters.sort} onChange={(e) => go({ sort: e.target.value as CatalogFilters["sort"] })} className={cn(control, "w-auto")}>
          <option value="default">Sort: recommended</option>
          <option value="frequency">Sort: most asked</option>
          <option value="difficulty">Sort: difficulty</option>
          <option value="title">Sort: title</option>
        </select>
        <Drawer label={<><SlidersHorizontal size={16} aria-hidden /> Filters</>} title="Filters" badge={chips.length}>
          <div className="space-y-4">
            <Select label="Difficulty" value={filters.difficulty ?? ""} onChange={(v) => go({ difficulty: (v || undefined) as CatalogFilters["difficulty"] })} options={[["", "Any"], ["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]]} />
            <Select label="Source" value={filters.source ?? ""} onChange={(v) => go({ source: (v || undefined) as CatalogFilters["source"] })} options={[["", "All sources"], ["algogym", "Algogym originals (solve here)"], ["external", "LeetCode (view original)"]]} />
            <Select label="Company" value={filters.company ?? ""} onChange={(v) => go({ company: v || undefined })} options={[["", "Any company"], ...companies.map((c): [string, string] => [c.slug, c.name])]} />
            <Select label="Topic" value={filters.tag ?? ""} onChange={(v) => go({ tag: v || undefined })} options={[["", "Any topic"], ...tags.map((t): [string, string] => [t.slug, t.name])]} />
            {progress.signedIn && (
              <Select label="Status" value={filters.status ?? ""} onChange={(v) => go({ status: (v || undefined) as CatalogFilters["status"] })} options={[["", "Any"], ["unsolved", "Not solved"], ["solved", "Solved"]]} />
            )}
            <Select label="Access" value={filters.access ?? ""} onChange={(v) => go({ access: (v || undefined) as CatalogFilters["access"] })} options={[["", "Free and Pro"], ["free", "Free"], ["pro", "Pro"]]} />
          </div>
        </Drawer>
        <Link href="/problems/shuffle" prefetch={false} className={buttonClass("secondary", "sm")} title="Open a random Algogym problem">
          <Shuffle size={16} aria-hidden /> <span className="hidden sm:inline">Shuffle</span>
        </Link>
        <Drawer label="Lists & daily" title="Lists, daily problem and companies" triggerClassName="xl:hidden">{sidebar}</Drawer>
        <div className="ml-auto"><SolvedRing {...progress} /></div>
      </div>
      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map(([label, patch]) => (
            <li key={label}>
              <button type="button" onClick={() => go(patch)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full bg-ag-surface-3 px-3 text-[13px] text-ag-text", focusRing)}>
                {label} <X size={12} aria-label={`Remove ${label}`} />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => { setQ(""); router.push("/problems", { scroll: false }); }} className={cn("h-8 px-2 text-[13px] text-ag-text-muted underline-offset-4 hover:text-ag-text hover:underline", focusRing)}>
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
