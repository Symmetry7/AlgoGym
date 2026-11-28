"use client";

import { ChevronDown, PanelRight, Search, Shuffle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { focusRing } from "@/components/shell/ui";
import { hrefWith, type CatalogFilters } from "@/lib/problem-catalog";
import { cn } from "@/lib/utils";
import { Drawer } from "./drawer";

const control = cn(
  "h-10 w-full rounded-[10px] border border-white/40 bg-white/[0.03] font-ui text-sm text-ag-text transition-colors duration-ag-hover ease-ag",
  "hover:border-white/60 active:border-white/70 placeholder:text-ag-text-faint",
  focusRing,
);

function Select({ label, value, options, onChange, className }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void; className?: string }) {
  const id = useId();
  return (
    <div className={cn("relative min-w-0", className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(control, "appearance-none truncate pl-3 pr-8", value ? "text-ag-text" : "text-ag-text-muted")}>
        {options.map(([v, l]) => <option key={v} value={v} className="bg-ag-surface-2 text-ag-text">{l}</option>)}
      </select>
      <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ag-text-faint" />
    </div>
  );
}

export function Toolbar({ filters, companies, tagName, signedIn, sidebar }: {
  filters: CatalogFilters;
  companies: { slug: string; name: string }[];
  tagName: Record<string, string>;
  signedIn: boolean;
  /** Daily problem, progress and lists, shown in a sheet below the xl breakpoint. */
  sidebar: ReactNode;
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
  const chips: [string, Partial<CatalogFilters>][] = [];
  if (filters.q) chips.push([`“${filters.q}”`, { q: undefined }]);
  if (filters.difficulty) chips.push([filters.difficulty, { difficulty: undefined }]);
  if (filters.company) chips.push([companyName(filters.company), { company: undefined }]);
  if (filters.tag) chips.push([tagName[filters.tag] ?? filters.tag, { tag: undefined }]);
  if (filters.status) chips.push([filters.status === "solved" ? "Solved" : "Not solved", { status: undefined }]);
  // The source param still works for old links; it's labelled by what it means, never by a brand.
  if (filters.source) chips.push([filters.source === "algogym" ? "Solvable now" : "Statement coming soon", { source: undefined }]);
  if (filters.access) chips.push([filters.access === "pro" ? "Pro" : "Free", { access: undefined }]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
        <div className="relative col-span-2 min-w-0 lg:flex-1">
          <label htmlFor={searchId} className="sr-only">Search problems</label>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ag-text-faint" />
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => { typed.current = true; setQ(e.target.value); }}
            placeholder="Search problems"
            className={cn(control, "pl-9 pr-3")}
          />
        </div>
        {signedIn && (
          <Select label="Status" className="lg:w-[128px]" value={filters.status ?? ""} onChange={(v) => go({ status: (v || undefined) as CatalogFilters["status"] })}
            options={[["", "Status"], ["unsolved", "Not solved"], ["solved", "Solved"]]} />
        )}
        <Select label="Difficulty" className="lg:w-[128px]" value={filters.difficulty ?? ""} onChange={(v) => go({ difficulty: (v || undefined) as CatalogFilters["difficulty"] })}
          options={[["", "Difficulty"], ["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]]} />
        <Select label="Company" className="lg:w-[148px]" value={filters.company ?? ""} onChange={(v) => go({ company: v || undefined })}
          options={[["", "Company"], ...companies.map((c): [string, string] => [c.slug, c.name])]} />
        <Select label="Sort" className={cn("lg:w-[150px]", !signedIn && "col-span-2 sm:col-span-1")} value={filters.sort} onChange={(v) => go({ sort: v as CatalogFilters["sort"] })}
          options={[["default", "Recommended"], ["frequency", "Most asked"], ["difficulty", "Difficulty"], ["title", "Title A–Z"]]} />
        <div className={cn("col-span-2 flex gap-2", !signedIn && "sm:col-span-1")}>
          <Link href="/problems/shuffle" prefetch={false} title="Open a random problem you can solve here"
            className={cn(control, "inline-flex flex-1 items-center justify-center gap-2 px-3 text-ag-text-muted hover:text-ag-text lg:w-10 lg:flex-none lg:px-0")}>
            <Shuffle size={16} aria-hidden /><span className="lg:sr-only">Random problem</span>
          </Link>
          <Drawer
            label={<><PanelRight size={16} aria-hidden /> Today &amp; progress</>}
            title="Today and progress"
            triggerClassName={cn(control, "flex-1 gap-2 px-3 font-normal text-ag-text-muted hover:bg-transparent hover:text-ag-text xl:hidden")}
          >
            {sidebar}
          </Drawer>
        </div>
      </div>
      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map(([label, patch]) => (
            <li key={label}>
              <button type="button" onClick={() => { if ("q" in patch) setQ(""); go(patch); }}
                className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] pl-3 pr-2 text-[13px] text-ag-text hover:border-white/20 active:bg-white/[0.1]", focusRing)}>
                {label} <X size={12} aria-hidden /><span className="sr-only">(remove filter)</span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => { setQ(""); router.push("/problems", { scroll: false }); }}
              className={cn("h-7 rounded-full px-2 text-[13px] text-ag-text-muted underline-offset-4 hover:text-ag-text hover:underline active:opacity-70", focusRing)}>
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
