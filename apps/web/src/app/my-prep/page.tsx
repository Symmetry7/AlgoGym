import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Briefcase, Code2, Flame, Trophy } from "lucide-react";
import { AccountMenu } from "@/components/shell/account-menu";
import { AppShell } from "@/components/shell/shells";
import { DifficultyChip, focusRing } from "@/components/shell/ui";
import { dailyPick, type CatalogProblem } from "@/lib/problem-catalog";
import { currentStreak, longestStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";
import { getCatalog } from "../../../server/problem-catalog";
import { getDailyMonth, istDate } from "../../../server/problems-personal";
import { currentUser } from "../../../server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Prep · Algogym" };

const VERDICT: Record<string, [string, string]> = {
  accepted: ["Accepted", "text-ag-accent"],
  wrong_answer: ["Wrong answer", "text-ag-hard"],
  runtime_error: ["Runtime error", "text-ag-hard"],
  time_limit_exceeded: ["Time limit", "text-ag-medium"],
  compile_error: ["Compile error", "text-ag-hard"],
};
const LANG: Record<string, string> = { javascript: "JavaScript", python: "Python", cpp: "C++", java: "Java" };
const card = "rounded-2xl border border-white/10 bg-[#0a0a0b]";

function ago(iso: string) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

function greeting() {
  const h = new Date(Date.now() + 330 * 60_000).getUTCHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function MyPrepPage() {
  const { db, user } = await currentUser();
  if (!db || !user) redirect("/sign-in?next=/my-prep");

  const today = istDate(new Date());
  const [catalog, daily, status, subs] = await Promise.all([
    getCatalog(),
    getDailyMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7))),
    db.from("user_problem_status").select("problem_id, status, solved_at, updated_at").order("updated_at", { ascending: false }),
    db.from("submissions").select("id, problem_id, verdict, lang, status, created_at").eq("mode", "submit").order("created_at", { ascending: false }).limit(6),
  ]);
  if (status.error || subs.error) throw new Error(`Could not load your progress: ${(status.error ?? subs.error)!.message}`);

  const byId = new Map(catalog.problems.map((p) => [p.id, p]));
  const solvedRows = status.data.filter((r) => r.status === "solved");
  const solved = solvedRows.map((r) => byId.get(r.problem_id)).filter((p): p is CatalogProblem => Boolean(p));
  const attempted = status.data.filter((r) => r.status === "attempted").map((r) => byId.get(r.problem_id)).filter((p): p is CatalogProblem => Boolean(p)).slice(0, 5);
  const dayCounts = new Map<string, number>();
  for (const r of solvedRows) if (r.solved_at) { const d = istDate(new Date(r.solved_at)); dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1); }
  const days = new Set(dayCounts.keys());
  const streak = currentStreak(days, today);
  const best = longestStreak(days);

  const pool = catalog.problems.filter((p) => p.source === "algogym" && !p.isPro).sort((a, b) => a.slug.localeCompare(b.slug));
  const todays = (daily.get(today) && byId.get(daily.get(today)!)) || dailyPick(today, pool);
  const totals = { Easy: pool.filter((p) => p.difficulty === "Easy").length, Medium: pool.filter((p) => p.difficulty === "Medium").length, Hard: pool.filter((p) => p.difficulty === "Hard").length };
  const count = (d: CatalogProblem["difficulty"]) => solved.filter((p) => p.difficulty === d).length;

  const name = (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "there";
  const first = name.split(" ")[0];

  // 12-week grid ending this week (columns are weeks, rows Monday..Sunday).
  const end = new Date(`${today}T00:00:00Z`);
  const startOffset = 7 * 11 + ((end.getUTCDay() + 6) % 7);
  const cells = Array.from({ length: startOffset + 1 }, (_, i) => new Date(end.getTime() - (startOffset - i) * 86_400_000).toISOString().slice(0, 10));

  return (
    <AppShell actions={<AccountMenu name={name} email={user.email ?? ""} avatarUrl={user.user_metadata?.avatar_url as string | undefined} />}>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 md:py-14">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[14px] text-[#a1a4a5]">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}</p>
            <h1 className="mt-1 text-[32px] font-semibold tracking-[-0.025em] text-[#f0f0f0] sm:text-[40px]">{greeting()}, {first}</h1>
          </div>
          <Link href="/problems" className={cn("ag-glass-button inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold text-white hover:brightness-125", focusRing)}>
            Browse problems <ArrowRight className="size-4" aria-hidden />
          </Link>
        </header>

        {/* Stats */}
        <section aria-label="Your progress" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={cn(card, "col-span-2 p-5")}>
            <p className="text-[13px] text-[#a1a4a5]">Problems solved</p>
            <p className="mt-2 text-[36px] font-semibold tabular-nums tracking-[-0.02em] text-[#f0f0f0]">{solved.length}<span className="ml-1.5 text-[16px] font-normal text-[#86888a]">/ {pool.length}</span></p>
            <div className="mt-4 space-y-2.5">
              {(["Easy", "Medium", "Hard"] as const).map((d) => (
                <div key={d} className="flex items-center gap-3 text-[13px]">
                  <span className="w-16 text-[#a1a4a5]">{d}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={cn("h-full rounded-full", d === "Easy" ? "bg-ag-easy" : d === "Medium" ? "bg-ag-medium" : "bg-ag-hard")} style={{ width: `${totals[d] ? (count(d) / totals[d]) * 100 : 0}%` }} />
                  </div>
                  <span className="w-14 text-right tabular-nums text-[#a1a4a5]">{count(d)} / {totals[d]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={cn(card, "p-5")}>
            <p className="flex items-center gap-2 text-[13px] text-[#a1a4a5]"><Flame className="size-4 text-ag-medium" aria-hidden /> Current streak</p>
            <p className="mt-2 text-[36px] font-semibold tabular-nums tracking-[-0.02em] text-[#f0f0f0]">{streak}<span className="ml-1.5 text-[16px] font-normal text-[#86888a]">{streak === 1 ? "day" : "days"}</span></p>
            <p className="mt-2 text-[13px] text-[#86888a]">{days.has(today) ? "You've solved today. Nice." : streak ? "Solve one today to keep it going." : "Solve a problem to start one."}</p>
          </div>
          <div className={cn(card, "p-5")}>
            <p className="flex items-center gap-2 text-[13px] text-[#a1a4a5]"><Trophy className="size-4 text-ag-pro" aria-hidden /> Longest streak</p>
            <p className="mt-2 text-[36px] font-semibold tabular-nums tracking-[-0.02em] text-[#f0f0f0]">{best}<span className="ml-1.5 text-[16px] font-normal text-[#86888a]">{best === 1 ? "day" : "days"}</span></p>
            <p className="mt-2 text-[13px] text-[#86888a]">{attempted.length ? `${attempted.length} in progress` : "Nothing half-finished"}</p>
          </div>
        </section>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {/* Today's problem */}
            {todays && (
              <section aria-labelledby="today" className={cn(card, "relative overflow-hidden p-6")}>
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,rgba(34,197,94,0.08),transparent_60%)]" />
                <p id="today" className="text-[13px] text-[#a1a4a5]">Today&rsquo;s problem</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-[#f0f0f0]">{todays.title}</h2>
                  <DifficultyChip level={todays.difficulty} />
                </div>
                <p className="mt-1.5 text-[14px] text-[#a1a4a5]">{todays.tags.slice(0, 3).map((t) => catalog.tags[t] ?? t).join(" · ") || "Algogym original"}</p>
                <Link href={`/problems/${todays.slug}`} className={cn("mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-colors hover:bg-white/90", focusRing)}>
                  {solved.some((p) => p.id === todays.id) ? "Solve again" : "Solve now"} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </section>
            )}

            {/* Recent submissions */}
            <section aria-labelledby="recent" className={card}>
              <h2 id="recent" className="border-b border-white/10 px-5 py-4 text-[15px] font-semibold text-[#f0f0f0]">Recent submissions</h2>
              {subs.data.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[15px] text-[#f0f0f0]">No submissions yet</p>
                  <p className="mt-1 text-[14px] text-[#a1a4a5]">Submit a solution and it shows up here with its verdict.</p>
                  {todays && <Link href={`/problems/${todays.slug}`} className={cn("mt-4 inline-flex rounded-sm text-[14px] font-medium text-white underline-offset-4 hover:underline", focusRing)}>Start with today&rsquo;s problem ›</Link>}
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.06]">
                  {subs.data.map((s) => {
                    const p = byId.get(s.problem_id);
                    const [label, tone] = s.status === "done" ? (VERDICT[s.verdict ?? ""] ?? [s.verdict ?? "Done", "text-[#a1a4a5]"]) : s.status === "error" ? ["Didn't run", "text-[#a1a4a5]"] : ["Judging…", "text-[#a1a4a5]"];
                    return (
                      <li key={s.id}>
                        <Link href={p ? `/problems/${p.slug}` : "/problems"} className={cn("flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03]", focusRing)}>
                          <span className="min-w-0 flex-1 truncate text-[14px] text-[#f0f0f0]">{p?.title ?? "Problem"}</span>
                          <span className={cn("w-28 shrink-0 text-[13px] font-medium", tone)}>{label}</span>
                          <span className="hidden w-20 shrink-0 text-[13px] text-[#a1a4a5] sm:block">{LANG[s.lang] ?? s.lang}</span>
                          <span className="w-20 shrink-0 text-right text-[13px] text-[#86888a]">{ago(s.created_at)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className="space-y-3">
            {/* Activity */}
            <section aria-labelledby="activity" className={cn(card, "p-5")}>
              <h2 id="activity" className="text-[15px] font-semibold text-[#f0f0f0]">Activity</h2>
              <p className="mt-1 text-[13px] text-[#a1a4a5]">Problems solved, last 12 weeks</p>
              <div className="mt-4 grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`${solvedRows.length} problems solved in total; ${days.size} active days`}>
                {cells.map((d) => {
                  const n = dayCounts.get(d) ?? 0;
                  return <span key={d} title={`${d}: ${n} solved`} className={cn("aspect-square rounded-[3px]", n === 0 ? "bg-white/[0.05]" : n === 1 ? "bg-ag-accent/40" : n === 2 ? "bg-ag-accent/70" : "bg-ag-accent", d === today && "ring-1 ring-white/40")} />;
                })}
              </div>
            </section>

            {/* Continue */}
            <section aria-labelledby="continue" className={cn(card, "p-5")}>
              <h2 id="continue" className="text-[15px] font-semibold text-[#f0f0f0]">Pick up where you left off</h2>
              {attempted.length === 0 ? (
                <p className="mt-2 text-[14px] text-[#a1a4a5]">Problems you&rsquo;ve tried but not solved yet will wait for you here.</p>
              ) : (
                <ul className="mt-3 space-y-1">
                  {attempted.map((p) => (
                    <li key={p.id}>
                      <Link href={`/problems/${p.slug}`} className={cn("flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-[14px] text-[#d4d4d8] hover:bg-white/[0.04] hover:text-white", focusRing)}>
                        <span className="truncate">{p.title}</span>
                        <DifficultyChip level={p.difficulty} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Shortcuts */}
            <nav aria-label="Shortcuts" className={cn(card, "p-2")}>
              {[
                { href: "/problems", label: "Problems", hint: "Filter by company and topic", icon: Code2 },
                { href: "/interview", label: "Interview prep", hint: "HR and SQL questions", icon: Briefcase },
                { href: "/pricing", label: "Plans", hint: "Free and Pro", icon: BookOpen },
              ].map(({ href, label, hint, icon: Icon }) => (
                <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04]", focusRing)}>
                  <span className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03]"><Icon className="size-4 text-[#d4d4d8]" aria-hidden /></span>
                  <span>
                    <span className="block text-[14px] font-medium text-[#f0f0f0]">{label}</span>
                    <span className="block text-[12.5px] text-[#a1a4a5]">{hint}</span>
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
