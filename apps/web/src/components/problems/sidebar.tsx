import { Check, Flame, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DifficultyChip, focusRing } from "@/components/shell/ui";
import { hrefWith, parseCatalogFilters, solveProgress, timeAgo, type CatalogFilters, type CatalogProblem } from "@/lib/problem-catalog";
import { currentStreak, longestStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";

const card = "rounded-[18px] border border-white/10 bg-ag-surface-1 p-5";
const cardTitle = "font-ui text-sm font-medium text-ag-text-muted";
const glassButton = cn("ag-glass-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] font-ui text-sm font-semibold text-ag-text transition-colors duration-ag-hover ease-ag hover:text-white", focusRing);

export interface SidebarPersonal {
  signedIn: boolean;
  solved: Set<string>;
  solvedDays: Set<string>;
  favorites: Set<string>;
  lists: { id: string; name: string; items: string[] }[];
  recent: { problemId: string; at: string }[];
}

function Ring({ solved, total }: { solved: number; total: number }) {
  const r = 38, c = 2 * Math.PI * r, share = total ? solved / total : 0;
  return (
    <div className="relative size-[92px] shrink-0">
      <svg viewBox="0 0 92 92" className="size-full -rotate-90" aria-hidden>
        <circle cx="46" cy="46" r={r} fill="none" strokeWidth="6" className="stroke-white/[0.07]" />
        {share > 0 && <circle cx="46" cy="46" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-ag-accent" strokeDasharray={`${c * share} ${c}`} />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-ui text-[22px] font-semibold leading-none tracking-tight text-ag-text">{solved}</span>
        <span className="mt-1 font-geist-mono text-[11px] text-ag-text-faint">/ {total}</span>
      </div>
    </div>
  );
}

export function TodayCard({ today, date }: { today: CatalogProblem | null; date: string }) {
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <section aria-label="Today’s problem" className={cn(card, "relative overflow-hidden")}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(60%_100%_at_80%_0%,var(--ag-accent-glow),transparent)]" />
      <div className="relative">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={cardTitle}>Today&rsquo;s problem</h2>
          <span className="text-[12px] text-ag-text-faint">{day}</span>
        </div>
        {today ? (
          <>
            <p className="mt-3 font-ui text-[17px] font-semibold leading-snug text-ag-text">{today.title}</p>
            <p className="mt-1.5"><DifficultyChip level={today.difficulty} /></p>
            <Link href={`/problems/${today.slug}`} className={cn(glassButton, "mt-4")}>Solve today&rsquo;s problem</Link>
          </>
        ) : <p className="mt-3 text-sm text-ag-text-muted">Today&rsquo;s pick is on its way. Check back soon.</p>}
      </div>
    </section>
  );
}

function ProgressCard({ all, personal, date }: { all: CatalogProblem[]; personal: SidebarPersonal; date: string }) {
  const p = solveProgress(all, personal.solved);
  const streak = currentStreak(personal.solvedDays, date);
  const best = longestStreak(personal.solvedDays);
  const tone = { Easy: "bg-ag-easy", Medium: "bg-ag-medium", Hard: "bg-ag-hard" } as const;
  return (
    <section aria-label="Your progress" className={card}>
      <h2 className={cardTitle}>Your progress</h2>
      <div className="mt-4 flex items-center gap-5">
        <div role="img" aria-label={`${p.solved} of ${p.total} problems solved`}><Ring solved={p.solved} total={p.total} /></div>
        <ul className="min-w-0 flex-1 space-y-2.5">
          {(["Easy", "Medium", "Hard"] as const).map((d) => (
            <li key={d}>
              <div className="flex items-baseline justify-between text-[12px]">
                <DifficultyChip level={d} />
                <span className="font-geist-mono text-ag-text-faint">{p.by[d].solved}/{p.by[d].total}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div className={cn("h-full rounded-full", tone[d])} style={{ width: `${p.by[d].total ? (p.by[d].solved / p.by[d].total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
      {personal.signedIn ? (
        <div className="mt-5 flex items-center gap-3 border-t border-white/[0.08] pt-4">
          <Flame size={18} aria-hidden className={streak ? "text-ag-medium" : "text-ag-text-faint"} />
          <p className="text-sm text-ag-text">
            <span className="font-semibold">{streak} {streak === 1 ? "day" : "days"}</span> <span className="text-ag-text-muted">current streak</span>
          </p>
          <span className="ml-auto font-geist-mono text-[12px] text-ag-text-faint">best {best}</span>
        </div>
      ) : (
        <>
          <p className="mt-5 text-sm leading-relaxed text-ag-text-muted">Sign in to track what you solve and keep a daily streak.</p>
          <Link href="/sign-in?next=/problems" className={cn(glassButton, "mt-3")}>Sign in</Link>
        </>
      )}
    </section>
  );
}

function RecentCard({ recent, byId, now }: { recent: SidebarPersonal["recent"]; byId: Map<string, CatalogProblem>; now: Date }) {
  const rows = recent.map((r) => ({ ...r, p: byId.get(r.problemId) })).filter((r) => r.p);
  return (
    <section aria-label="Recent activity" className={card}>
      <h2 className={cardTitle}>Recent activity</h2>
      {rows.length ? (
        <ol className="mt-3 space-y-0.5">
          {rows.map(({ p, at }) => (
            <li key={p!.id}>
              <Link href={`/problems/${p!.slug}`} className={cn("-mx-2 flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors duration-ag-hover ease-ag hover:bg-white/[0.05] active:bg-white/[0.08]", focusRing)}>
                <Check size={14} aria-hidden className="shrink-0 text-ag-accent" />
                <span className="min-w-0 flex-1 truncate text-sm text-ag-text">{p!.title}</span>
                <time dateTime={at} className="shrink-0 text-[12px] text-ag-text-faint">{timeAgo(at, now)}</time>
              </Link>
            </li>
          ))}
        </ol>
      ) : <p className="mt-3 text-sm leading-relaxed text-ag-text-muted">Problems you solve show up here.</p>}
    </section>
  );
}

function ListsCard({ personal, filters, byId, newList }: { personal: SidebarPersonal; filters: CatalogFilters; byId: Map<string, CatalogProblem>; newList: ReactNode }) {
  const link = (key: string, label: string, n: number, icon?: ReactNode) => (
    <li key={key}>
      <Link href={hrefWith(parseCatalogFilters({}), { list: key })} aria-current={filters.list === key ? "true" : undefined}
        className={cn("-mx-2 flex h-9 items-center gap-2.5 rounded-[10px] px-2 text-sm transition-colors duration-ag-hover ease-ag",
          filters.list === key ? "bg-white/[0.07] text-ag-text" : "text-ag-text-muted hover:bg-white/[0.05] hover:text-ag-text active:bg-white/[0.08]", focusRing)}>
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="font-geist-mono text-[12px] text-ag-text-faint">{n}</span>
      </Link>
    </li>
  );
  return (
    <section aria-label="My lists" className={card}>
      <div className="flex items-center justify-between">
        <h2 className={cardTitle}>My lists</h2>
        {newList}
      </div>
      <ul className="mt-2">
        {link("favorites", "Favourites", personal.favorites.size, <Star size={14} aria-hidden className="text-ag-pro" />)}
        {personal.lists.map((l) => link(l.id, l.name, l.items.filter((id) => byId.has(id)).length))}
      </ul>
    </section>
  );
}

/** The right column on desktop, and the "Today & progress" sheet below xl. */
export function ProblemsSidebar({ all, byId, today, date, personal, filters, newList }: {
  all: CatalogProblem[];
  byId: Map<string, CatalogProblem>;
  today: CatalogProblem | null;
  date: string;
  personal: SidebarPersonal;
  filters: CatalogFilters;
  newList: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <TodayCard today={today} date={date} />
      <ProgressCard all={all} personal={personal} date={date} />
      {personal.signedIn && <RecentCard recent={personal.recent} byId={byId} now={new Date()} />}
      {personal.signedIn && <ListsCard personal={personal} filters={filters} byId={byId} newList={newList} />}
    </div>
  );
}
