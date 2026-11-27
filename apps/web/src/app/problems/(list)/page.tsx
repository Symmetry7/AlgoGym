import { Check, ExternalLink, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/shells";
import { ButtonLink, DifficultyChip, SoonBadge, focusRing } from "@/components/shell/ui";
import { dailyPick, frequencyBars, hrefWith, monthGrid, parseCatalogFilters, queryCatalog, tagCounts, type CatalogFilters, type CatalogProblem } from "@/lib/problem-catalog";
import { cn } from "@/lib/utils";
import { getCatalog, type CatalogData } from "../../../../server/problem-catalog";
import { getDailyMonth, getPersonal, istDate, type Personal } from "../../../../server/problems-personal";
import { NewList } from "./new-list";
import { Toolbar } from "./toolbar";

export const metadata: Metadata = {
  title: "Problems · Algogym",
  description: "Original interview problems you can solve in the browser, plus the questions top companies ask, with links to the originals.",
};

// Render per request: never query Supabase at build time (DECISIONS.md).
export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("en-IN");
const navLink = "flex h-9 items-center justify-between rounded-ag-control px-3 text-sm";

function LeftNav({ personal, filters, byId }: { personal: Personal; filters: CatalogFilters; byId: Map<string, CatalogProblem> }) {
  const soon = ["Roadmaps", "Learn", "Study plans", "Companies"];
  const listLink = (key: string, label: string, n: number) => (
    <li key={key}>
      <Link href={hrefWith(parseCatalogFilters({}), { list: key })} aria-current={filters.list === key ? "true" : undefined}
        className={cn(navLink, filters.list === key ? "bg-ag-surface-2 text-ag-text" : "text-ag-text-muted hover:bg-ag-surface-2 hover:text-ag-text", focusRing)}>
        <span className="truncate">{label}</span><span className="font-geist-mono text-xs text-ag-text-faint">{n}</span>
      </Link>
    </li>
  );
  return (
    <nav aria-label="Practice" className="space-y-6">
      <ul className="space-y-1">
        <li><Link href="/problems" aria-current={filters.list ? undefined : "page"} className={cn(navLink, !filters.list ? "bg-ag-surface-2 font-medium text-ag-text" : "text-ag-text-muted hover:bg-ag-surface-2", focusRing)}>Library</Link></li>
        <li><Link href="/interview" className={cn(navLink, "text-ag-text-muted hover:bg-ag-surface-2 hover:text-ag-text", focusRing)}>Interview prep</Link></li>
        {soon.map((s) => <li key={s} className={cn(navLink, "text-ag-text-faint")}>{s} <SoonBadge /></li>)}
      </ul>
      <section aria-labelledby="lists-h">
        <div className="flex items-center justify-between px-3">
          <h2 id="lists-h" className="text-[13px] font-semibold uppercase tracking-wide text-ag-text-faint">My lists</h2>
          {personal.signedIn && <NewList />}
        </div>
        {personal.signedIn ? (
          <ul className="mt-2 space-y-1">
            {listLink("favorites", "Favourites", personal.favorites.size)}
            {personal.lists.map((l) => listLink(l.id, l.name, l.items.filter((id) => byId.has(id)).length))}
          </ul>
        ) : (
          <p className="mt-2 px-3 text-[13px] leading-relaxed text-ag-text-muted">
            <Link href="/sign-in" className={cn("text-ag-text underline underline-offset-4", focusRing)}>Sign in</Link> to keep favourites and your own lists.
          </p>
        )}
      </section>
    </nav>
  );
}

function DailyCard({ data, personal, daily }: { data: CatalogData; personal: Personal; daily: Map<string, string> }) {
  const today = istDate(new Date());
  const [y, m] = today.split("-").map(Number);
  const byId = new Map(data.problems.map((p) => [p.id, p]));
  const pool = data.problems.filter((p) => p.source === "algogym" && !p.isPro).sort((a, b) => a.slug.localeCompare(b.slug));
  const todays = (daily.get(today) && byId.get(daily.get(today)!)) || dailyPick(today, pool);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
  const key = (day: number) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return (
    <section aria-labelledby="daily-h" className="rounded-ag-card border border-ag-border bg-ag-surface-1 p-4">
      <div className="flex items-baseline justify-between">
        <h2 id="daily-h" className="text-sm font-semibold text-ag-text">Daily problem</h2>
        <span className="text-[13px] text-ag-text-faint">{month}</span>
      </div>
      {todays && (
        <Link href={`/problems/${todays.slug}`} className={cn("mt-2 block rounded-md text-sm text-ag-accent hover:underline hover:underline-offset-4", focusRing)}>
          Today: {todays.title}
        </Link>
      )}
      <table className="mt-3 w-full table-fixed text-center text-[12px]">
        <caption className="sr-only">{month}. Today is circled{personal.signedIn ? "; days you solved a problem have a dot" : ""}.</caption>
        <thead><tr>{["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <th key={i} scope="col" className="pb-1 font-normal text-ag-text-faint">{w}</th>)}</tr></thead>
        <tbody>
          {monthGrid(y, m).map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => (
                <td key={di} className="py-0.5">
                  {day && (
                    <span className={cn("relative mx-auto flex size-7 items-center justify-center rounded-full",
                      key(day) === today ? "bg-ag-accent font-semibold text-ag-on-accent" : key(day) > today ? "text-ag-text-faint" : "text-ag-text-muted")}
                      aria-current={key(day) === today ? "date" : undefined}>
                      {day}
                      {personal.solvedDays.has(key(day)) && <span className="absolute bottom-0.5 size-1 rounded-full bg-ag-accent" aria-label="solved" />}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SidebarCards({ data, filters, personal, daily }: { data: CatalogData; filters: CatalogFilters; personal: Personal; daily: Map<string, string> }) {
  const originals = data.problems.filter((p) => p.source === "algogym").length;
  return (
    <div className="space-y-4">
      <DailyCard data={data} personal={personal} daily={daily} />
      <section aria-labelledby="companies-h" className="rounded-ag-card border border-ag-border bg-ag-surface-1 p-4">
        <h2 id="companies-h" className="text-sm font-semibold text-ag-text">Trending companies</h2>
        <ul className="mt-3 space-y-1">
          {data.companies.slice(0, 10).map((c) => (
            <li key={c.slug}>
              <Link href={hrefWith(filters, { company: filters.company === c.slug ? undefined : c.slug })} aria-current={filters.company === c.slug ? "true" : undefined}
                className={cn("flex h-9 items-center justify-between rounded-md px-2 text-sm hover:bg-ag-surface-2", filters.company === c.slug ? "bg-ag-surface-2 text-ag-text" : "text-ag-text-muted", focusRing)}>
                {c.name} <span className="font-geist-mono text-xs text-ag-text-faint">{fmt.format(c.problems)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="progress-h" className="rounded-ag-card border border-ag-border bg-ag-surface-1 p-4">
        <h2 id="progress-h" className="text-sm font-semibold text-ag-text">Your progress</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ag-text-muted">
          {personal.signedIn
            ? <>{personal.solved.size} of {originals} Algogym problems solved. Solves count once you submit in the workspace.</>
            : <>{originals} Algogym problems to solve here, and {fmt.format(data.problems.length - originals)} company questions to practise on LeetCode. <Link href="/sign-in" className={cn("text-ag-text underline underline-offset-4", focusRing)}>Sign in</Link> to track what you solve.</>}
        </p>
      </section>
    </div>
  );
}

function Bars({ frequency }: { frequency: number }) {
  const n = frequencyBars(frequency);
  return (
    <span className="inline-flex items-end gap-0.5" role="img" aria-label={`Asked often: ${n} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => <span key={i} className={cn("w-1 rounded-sm", i < n ? "bg-ag-accent" : "bg-ag-surface-3")} style={{ height: 6 + i * 2 }} />)}
    </span>
  );
}

function Row({ p, filters, odd, solved, companyName }: { p: CatalogProblem; filters: CatalogFilters; odd: boolean; solved: boolean; companyName: (s: string) => string }) {
  const original = p.source === "algogym";
  const top = Object.entries(p.frequency).sort((a, b) => b[1] - a[1]);
  return (
    <li className={cn("flex min-h-14 items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5", odd ? "bg-ag-surface-1" : "")}>
      <span className="w-4 shrink-0">{solved && <Check size={16} className="text-ag-accent" aria-label="Solved" />}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {original
            ? <Link href={`/problems/${p.slug}`} className={cn("rounded-sm text-[15px] font-medium text-ag-text hover:underline hover:underline-offset-4", focusRing)}>{p.title}</Link>
            : <span className="text-[15px] font-medium text-ag-text">{p.title}</span>}
          {original
            ? <span className="rounded-full bg-ag-accent-soft px-2 py-0.5 text-[11px] font-semibold text-ag-accent">Algogym</span>
            : <span className="rounded-full bg-ag-surface-3 px-2 py-0.5 text-[11px] font-semibold text-ag-text-muted">LeetCode</span>}
          {p.isPro && <Lock size={14} className="text-ag-pro" aria-label="Pro" />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ag-text-faint">
          {!original && p.sourceUrl?.startsWith("https://") && (
            <a href={p.sourceUrl} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1 text-ag-text-muted hover:text-ag-text", focusRing)}>
              View original <ExternalLink size={12} aria-hidden /><span className="sr-only">(opens LeetCode in a new tab)</span>
            </a>
          )}
          {p.similar && (
            <span>Similar Algogym problem:{" "}
              <Link href={`/problems/${p.similar.slug}`} className={cn("text-ag-accent hover:underline hover:underline-offset-4", focusRing)}>{p.similar.title}</Link>
            </span>
          )}
          {top.length > 0 && (
            <span className="hidden items-center gap-1.5 md:inline-flex">
              {top.slice(0, 3).map(([slug]) => (
                <Link key={slug} href={hrefWith(filters, { company: slug })} className={cn("rounded-full bg-ag-surface-2 px-2 py-0.5 text-[12px] text-ag-text-muted hover:text-ag-text", focusRing)}>{companyName(slug)}</Link>
              ))}
              {top.length > 3 && <span className="text-[12px]">+{top.length - 3}</span>}
            </span>
          )}
        </div>
      </div>
      <div className="w-16 shrink-0 text-right sm:w-20 sm:text-left"><DifficultyChip level={p.difficulty} /></div>
      {filters.company && <div className="hidden w-10 shrink-0 sm:block">{p.frequency[filters.company] !== undefined ? <Bars frequency={p.frequency[filters.company]} /> : null}</div>}
    </li>
  );
}

function Pagination({ filters, page, pages }: { filters: CatalogFilters; page: number; pages: number }) {
  if (pages <= 1) return null;
  const near = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const link = "inline-flex h-9 min-w-9 items-center justify-center rounded-ag-control px-3 text-sm";
  return (
    <nav aria-label="Pages" className="mt-6 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && <Link href={hrefWith(filters, { page: page - 1 })} className={cn(link, "text-ag-text-muted hover:bg-ag-surface-2", focusRing)}>Previous</Link>}
      {near.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && n - near[i - 1] > 1 && <span className="px-1 text-ag-text-faint">…</span>}
          <Link href={hrefWith(filters, { page: n })} aria-current={n === page ? "page" : undefined} className={cn(link, n === page ? "bg-ag-surface-3 text-ag-text" : "text-ag-text-muted hover:bg-ag-surface-2", focusRing)}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link href={hrefWith(filters, { page: page + 1 })} className={cn(link, "text-ag-text-muted hover:bg-ag-surface-2", focusRing)}>Next</Link>}
    </nav>
  );
}

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = istDate(new Date());
  const [data, params, personal, daily] = await Promise.all([getCatalog(), searchParams, getPersonal(), getDailyMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7)))]);
  const filters = parseCatalogFilters(params);
  const byId = new Map(data.problems.map((p) => [p.id, p]));
  const listItems = filters.list === "favorites" ? personal.favorites : personal.lists.find((l) => l.id === filters.list)?.items;
  const only = filters.list ? new Set(listItems ?? []) : undefined;
  const result = queryCatalog(data.problems, filters, { solved: personal.solved, only });
  const tags = tagCounts(data.problems);
  const originals = data.problems.filter((p) => p.source === "algogym").length;
  const companyNames = new Map(data.companies.map((c) => [c.slug, c.name]));
  const listName = filters.list === "favorites" ? "Favourites" : personal.lists.find((l) => l.id === filters.list)?.name;
  const sidebar = <SidebarCards data={data} filters={filters} personal={personal} daily={daily} />;
  const pill = "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm";

  return (
    <AppShell actions={personal.signedIn ? undefined : <ButtonLink href="/sign-in" variant="secondary" size="sm">Log in</ButtonLink>}>
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="hidden lg:block"><div className="sticky top-20"><LeftNav personal={personal} filters={filters} byId={byId} /></div></aside>

        <div className="min-w-0">
          <ul className="grid gap-3 md:grid-cols-3" aria-label="Start here">
            {[
              { href: hrefWith(parseCatalogFilters({}), { source: "algogym" }), title: `${originals} original problems`, body: "Written for Algogym, with examples and hints." },
              { href: hrefWith(parseCatalogFilters({}), { company: data.companies[0]?.slug }), title: "Practise by company", body: `What ${data.companies[0]?.name ?? "top companies"} and ${Math.max(0, data.companies.length - 1)} others ask.` },
              { href: "/interview", title: "HR and SQL rounds", body: "Example answers and worked queries." },
            ].map((c) => (
              <li key={c.title}>
                <Link href={c.href} className={cn("ag-glass block h-full rounded-ag-card p-4 transition-colors duration-ag-hover ease-ag hover:bg-white/[0.05]", focusRing)}>
                  <span className="block text-[15px] font-semibold text-ag-text">{c.title}</span>
                  <span className="mt-1 block text-[13px] text-ag-text-muted">{c.body}</span>
                </Link>
              </li>
            ))}
          </ul>

          <h1 className="mt-10 font-display text-[40px] leading-none text-ag-text sm:text-[48px]">{listName ?? "Problems"}</h1>
          {filters.list && !listName && <p className="mt-3 text-sm text-ag-text-muted">That list isn&rsquo;t available. It may belong to another account, or you may need to sign in.</p>}

          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2" aria-label="Topics">
            {tags.map((t) => (
              <li key={t.slug}>
                <Link href={hrefWith(filters, { tag: filters.tag === t.slug ? undefined : t.slug })} aria-current={filters.tag === t.slug ? "true" : undefined}
                  className={cn("rounded-sm text-sm hover:text-ag-text", filters.tag === t.slug ? "text-ag-text" : "text-ag-text-muted", focusRing)}>
                  {data.tags[t.slug] ?? t.slug} <span className="text-ag-text-faint">{t.n}</span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Categories">
            <li><Link href="/problems" className={cn(pill, "bg-ag-surface-3 text-ag-text", focusRing)} aria-current="page">All topics</Link></li>
            <li><Link href="/interview?kind=sql" className={cn(pill, "bg-ag-surface-2 text-ag-text-muted hover:text-ag-text", focusRing)}>SQL</Link></li>
            <li><Link href="/interview?kind=hr" className={cn(pill, "bg-ag-surface-2 text-ag-text-muted hover:text-ag-text", focusRing)}>HR</Link></li>
            <li><span className={cn(pill, "bg-ag-surface-2 text-ag-text-faint")}>System design <SoonBadge /></span></li>
          </ul>

          <Toolbar
            filters={filters}
            companies={data.companies}
            tags={tags.map((t) => ({ slug: t.slug, name: data.tags[t.slug] ?? t.slug }))}
            sidebar={<div className="space-y-6"><LeftNav personal={personal} filters={filters} byId={byId} />{sidebar}</div>}
            progress={{ signedIn: personal.signedIn, solved: [...personal.solved].filter((id) => byId.get(id)?.source === "algogym").length, total: originals }}
          />

          <p className="mt-5 text-sm text-ag-text-muted" aria-live="polite">
            {fmt.format(result.total)} {result.total === 1 ? "problem" : "problems"}
            {result.pages > 1 && <> · page {result.page} of {result.pages}</>}
          </p>

          {result.rows.length ? (
            <ul className="mt-3 overflow-hidden rounded-ag-card border border-ag-border">
              {result.rows.map((p, i) => <Row key={p.id} p={p} filters={filters} odd={i % 2 === 0} solved={personal.solved.has(p.id)} companyName={(s) => companyNames.get(s) ?? s} />)}
            </ul>
          ) : (
            <div className="mt-3 rounded-ag-card border border-ag-border bg-ag-surface-1 px-6 py-14 text-center">
              <p className="text-base text-ag-text">{filters.list ? "Nothing in this list yet." : "No problems match these filters."}</p>
              <p className="mt-2 text-sm text-ag-text-muted">{filters.list ? "Save problems from their page to see them here." : "Try another company or difficulty, or clear the filters."}</p>
              <ButtonLink href="/problems" variant="secondary" size="sm" className="mt-5">{filters.list ? "Back to all problems" : "Clear filters"}</ButtonLink>
            </div>
          )}
          <Pagination filters={filters} page={result.page} pages={result.pages} />
        </div>

        <aside className="hidden xl:block"><div className="sticky top-20">{sidebar}</div></aside>
      </div>
    </AppShell>
  );
}
