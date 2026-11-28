import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CompanyLogo } from "@/components/problems/company-logo";
import { ProblemListHeader, ProblemRow } from "@/components/problems/problem-row";
import { Scroller } from "@/components/problems/scroller";
import { ProblemsSidebar } from "@/components/problems/sidebar";
import { TopicChips } from "@/components/problems/topic-chips";
import { AccountMenu } from "@/components/shell/account-menu";
import { AppShell } from "@/components/shell/shells";
import { ButtonLink, focusRing } from "@/components/shell/ui";
import { PAGE_SIZE, dailyPick, hrefWith, parseCatalogFilters, queryCatalog, tagCounts, type CatalogFilters } from "@/lib/problem-catalog";
import { cn } from "@/lib/utils";
import { getCatalog } from "../../../../server/problem-catalog";
import { getDailyMonth, getPersonal, istDate } from "../../../../server/problems-personal";
import { NewList } from "./new-list";
import { Toolbar } from "./toolbar";

export const metadata: Metadata = {
  title: "Problems · Algogym",
  description: "Interview problems sorted by how often top companies ask them. Solve them in the browser and track your streak.",
};

// Render per request: never query Supabase at build time (DECISIONS.md).
export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("en-IN");

function Pagination({ filters, page, pages }: { filters: CatalogFilters; page: number; pages: number }) {
  if (pages <= 1) return null;
  const near = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const link = cn("inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] px-3 font-ui text-sm transition-colors duration-ag-hover ease-ag", focusRing);
  const idle = "text-ag-text-muted hover:bg-white/[0.06] hover:text-ag-text active:bg-white/[0.1]";
  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && <Link href={hrefWith(filters, { page: page - 1 })} className={cn(link, idle)}>Previous</Link>}
      {near.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && n - near[i - 1] > 1 && <span aria-hidden className="px-1 text-ag-text-faint">…</span>}
          <Link href={hrefWith(filters, { page: n })} aria-current={n === page ? "page" : undefined}
            className={cn(link, "hidden font-geist-mono sm:inline-flex", n === page ? "!inline-flex border border-white/15 bg-white/[0.06] text-ag-text" : idle)}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link href={hrefWith(filters, { page: page + 1 })} className={cn(link, idle)}>Next</Link>}
    </nav>
  );
}

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = istDate(new Date());
  const [data, params, personal, daily] = await Promise.all([getCatalog(), searchParams, getPersonal(), getDailyMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7)))]);
  const filters = parseCatalogFilters(params);
  const byId = new Map(data.problems.map((p) => [p.id, p]));
  const listItems = filters.list === "favorites" ? personal.favorites : personal.lists.find((l) => l.id === filters.list)?.items;
  const result = queryCatalog(data.problems, filters, { solved: personal.solved, only: filters.list ? new Set(listItems ?? []) : undefined });
  const tags = tagCounts(data.problems);
  const companyNames = new Map(data.companies.map((c) => [c.slug, c.name]));
  const companyName = (s: string) => companyNames.get(s) ?? s;
  const rank = new Map(data.companies.map((c, i) => [c.slug, i]));
  const listName = filters.list === "favorites" ? "Favourites" : personal.lists.find((l) => l.id === filters.list)?.name;
  const pool = data.problems.filter((p) => p.source === "algogym" && !p.isPro).sort((a, b) => a.slug.localeCompare(b.slug));
  const todays = (daily.get(today) && byId.get(daily.get(today)!)) || dailyPick(today, pool);
  const topCompanies = data.companies.filter((c) => c.problems > 0).slice(0, 14);
  const filtered = Boolean(filters.q || filters.difficulty || filters.company || filters.tag || filters.status || filters.source || filters.access);

  const sidebar = (
    <ProblemsSidebar all={data.problems} byId={byId} today={todays ?? null} date={today} personal={personal} filters={filters} newList={<NewList />} />
  );

  return (
    <AppShell actions={personal.account ? <AccountMenu {...personal.account} /> : <ButtonLink href="/sign-in?next=/problems" variant="secondary" size="sm">Log in</ButtonLink>}>
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-4 pb-24 pt-8 sm:px-6 sm:pt-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <header>
            <h1 className="font-display text-[40px] leading-none tracking-[-0.01em] text-ag-text sm:text-[52px]">{listName ?? "Problems"}</h1>
            <p className="mt-3 max-w-[64ch] text-pretty text-[15px] leading-relaxed text-ag-text-muted sm:text-base">
              {filters.list && !listName
                ? "That list isn’t available. It may belong to another account, or you may need to sign in."
                : listName
                  ? "Your saved problems, in the order you added them."
                  : `${fmt.format(data.problems.length)} interview questions, ranked by how often top companies ask them.`}
            </p>
          </header>

          {!filters.list && topCompanies.length > 0 && (
            <div className="mt-8">
              <Scroller
                label="Top companies"
                title="Top companies"
                action={filters.company && <Link href={hrefWith(filters, { company: undefined })} scroll={false} className={cn("rounded-md px-1 text-[13px] text-ag-text-muted hover:text-ag-text", focusRing)}>Show all</Link>}
              >
                {topCompanies.map((c) => {
                  const active = filters.company === c.slug;
                  return (
                    <li key={c.slug} className="snap-start">
                      <Link
                        href={hrefWith(filters, { company: active ? undefined : c.slug })}
                        scroll={false}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "group relative flex h-[112px] w-[172px] flex-col justify-between overflow-hidden rounded-[18px] border p-4 transition-colors duration-ag-hover ease-ag",
                          active ? "border-ag-accent bg-ag-accent-soft" : "border-white/10 bg-ag-surface-1 hover:border-white/20 hover:bg-ag-surface-2 active:bg-ag-surface-3",
                          focusRing,
                        )}
                      >
                        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(70%_100%_at_30%_0%,var(--ag-light-3),transparent)]" />
                        <span className="relative flex items-start justify-between">
                          <CompanyLogo slug={c.slug} name={c.name} size={36} className="rounded-[10px]" />
                        </span>
                        <span className="relative">
                          <span className="block truncate font-ui text-[15px] font-semibold text-ag-text">{c.name}</span>
                          <span className="mt-0.5 block font-geist-mono text-[12px] text-ag-text-faint">{fmt.format(c.problems)} problems</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </Scroller>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <TopicChips
              chips={[
                { key: "all", label: "All topics", href: hrefWith(filters, { tag: undefined }), active: !filters.tag },
                ...tags.map((t) => ({ key: t.slug, label: (data.tags[t.slug] ?? t.slug).replace(/^'(.*)'$/, "$1"), n: t.n, href: hrefWith(filters, { tag: filters.tag === t.slug ? undefined : t.slug }), active: filters.tag === t.slug })),
              ]}
            />
            <Toolbar filters={filters} companies={data.companies} tagName={data.tags} signedIn={personal.signedIn} sidebar={sidebar} />
          </div>

          <div className="mt-6 flex items-baseline justify-between gap-4">
            <p className="text-sm text-ag-text-muted" aria-live="polite">
              <span className="text-ag-text">{fmt.format(result.total)}</span> {result.total === 1 ? "problem" : "problems"}
              {filters.company && <> asked at <span className="text-ag-text">{companyName(filters.company)}</span></>}
            </p>
            {result.pages > 1 && <p className="font-geist-mono text-[12px] text-ag-text-faint">Page {result.page} of {result.pages}</p>}
          </div>

          {result.rows.length ? (
            <>
              <div className="mt-2"><ProblemListHeader /></div>
              <ul aria-label="Problems">
                {result.rows.map((p, i) => (
                  <ProblemRow key={p.id} p={p} n={(result.page - 1) * PAGE_SIZE + i + 1} striped={i % 2 === 0} solved={personal.solved.has(p.id)} company={filters.company} companyName={companyName} rank={rank} />
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-[18px] border border-dashed border-white/10 px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-ag-text-muted"><SearchX size={20} aria-hidden /></span>
              <p className="mt-4 font-ui text-base font-semibold text-ag-text">{filters.list ? "Nothing in this list yet" : "No problems match these filters"}</p>
              <p className="mt-1.5 max-w-[40ch] text-sm text-ag-text-muted">
                {filters.list ? "Save problems from their page and they’ll collect here." : "Try another company, topic or difficulty, or start again with every problem."}
              </p>
              {(filtered || filters.list) && (
                <ButtonLink href="/problems" variant="secondary" size="sm" className="mt-6">{filters.list ? "Back to all problems" : "Clear filters"}</ButtonLink>
              )}
            </div>
          )}
          <Pagination filters={filters} page={result.page} pages={result.pages} />
        </div>

        <aside className="hidden xl:sticky xl:top-20 xl:block xl:self-start" aria-label="Today and progress">
          {sidebar}
        </aside>
      </div>
    </AppShell>
  );
}
