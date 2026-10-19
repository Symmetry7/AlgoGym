"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ChakraMark } from "@/components/brand/ChakraMark";
import { useTracker } from "@/hooks/use-tracker";
import { useAccount } from "@/hooks/use-account";
import {
  RatingChart,
  ChakraChart,
  Distribution,
} from "@/components/analytics/Charts";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { TrackerFeedback } from "@/components/analytics/TrackerFeedback";
import type { ReactNode } from "react";
import {
  CodeforcesWorkspace,
  type StatisticsView,
} from "@/components/analytics/CodeforcesWorkspace";
export function AnalyticsPanel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`ag-data-panel min-w-0 border bg-card p-5 sm:p-6 ${className}`}
    >
      <header className="mb-6">
        <h2 className="text-sm font-medium">{title}</h2>
        {description && (
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}
export default function Statistics() {
  const [view, setView] = useState<StatisticsView>("overview");
  const [days, setDays] = useState(365);
  const [provider, setProvider] = useState("all");
  const tracker = useTracker(days, provider);
  const account = useAccount();
  const data = tracker.data;
  const cf = data?.snapshots.find((item) => item.provider === "codeforces");
  const lc = data?.snapshots.find((item) => item.provider === "leetcode");
  const leetcodeSolved = lc?.summary.totalSolved ?? 0;
  const totalSolved = data?.overview.totalSolves ?? 0;
  return (
    <Layout>
      <div className="space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[.12em] text-muted-foreground">
              Your coding, in perspective
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Statistics
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Understand your consistency, difficulty range, and progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="space-y-1.5">
              <span className="block text-[11px] text-muted-foreground">
                Platform
              </span>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                className="h-9 rounded-md border bg-card px-3 text-xs"
              >
                <option value="all">All platforms</option>
                <option value="codeforces">Codeforces</option>
                <option value="leetcode">LeetCode</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] text-muted-foreground">
                Date range
              </span>
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className="h-9 rounded-md border bg-card px-3 text-xs"
              >
                {[
                  [7, "Last 7 days"],
                  [30, "Last 30 days"],
                  [90, "Last 90 days"],
                  [365, "Last year"],
                  [0, "All time"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <nav
          aria-label="Statistics views"
          className="flex gap-1 overflow-x-auto border-b pb-3"
        >
          {(
            [
              ["overview", "Overview"],
              ["submissions", "Submissions"],
              ["problems", "Problem ladder"],
              ["rating", "Rating change"],
              ["timeline", "Contest timeline"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setView(value)}
              aria-current={view === value ? "page" : undefined}
              className={`shrink-0 rounded-md px-4 py-2.5 text-xs transition-colors ${view === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <TrackerFeedback tracker={tracker} />
        {view !== "overview" ? (
          <CodeforcesWorkspace
            view={view}
            days={days}
            syncing={tracker.isSyncing}
          />
        ) : (
          <>
            {tracker.isLoading ? (
              <div
                role="status"
                aria-label="Loading coding statistics"
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-lg border bg-card"
                    />
                  ))}
                </div>
                <div className="h-80 animate-pulse rounded-lg border bg-card" />
              </div>
            ) : data ? (
              <>
                {!data.accounts.length && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">
                      Connect a coding account to start building your
                      statistics.
                    </p>
                    <Link
                      href="/onboarding?step=3"
                      className="text-sm text-primary"
                    >
                      Connect profiles{" "}
                      <ArrowUpRight className="inline size-3.5" />
                    </Link>
                  </div>
                )}
                <section
                  aria-label="Performance overview"
                  className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"
                >
                  {[
                    [
                      "Total solves",
                      totalSolved,
                      "Codeforces history + LeetCode profile",
                    ],
                    [
                      "Total coins",
                      data.overview.chakra,
                      "All-time ledger balance",
                    ],
                    [
                      "Codeforces rating",
                      cf?.summary.rating,
                      "Current · provider-specific",
                    ],
                    [
                      "Peak rating",
                      cf?.summary.maxRating,
                      "Codeforces all-time peak",
                    ],
                    [
                      "Active days",
                      data.overview.activeDays,
                      "Verified practice · selected period",
                    ],
                    [
                      "Rated contests",
                      cf?.summary.ratedContests,
                      "Codeforces rated participation",
                    ],
                  ].map(([title, value, description]) => (
                    <div
                      key={String(title)}
                      className="rounded-lg border bg-card p-4"
                    >
                      <p className="text-[11px] text-muted-foreground">
                        {title}
                      </p>
                      <p
                        className={`mt-3 text-2xl font-semibold tracking-tight tabular-nums ${title === "Total coins" ? "text-primary" : ""}`}
                      >
                        {typeof value === "number"
                          ? Math.round(value).toLocaleString()
                          : "—"}
                      </p>
                      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  ))}
                </section>
                <AnalyticsPanel title="Solved problems" description="All-time counts from your synchronized Codeforces history and LeetCode public profile.">
                  <div className="flex flex-col items-center gap-7 py-2 sm:flex-row sm:justify-center sm:gap-12">
                    <div className="text-center sm:text-right"><p className="text-2xl font-semibold tabular-nums">{data.solves.filter((item) => item.provider === "codeforces").length.toLocaleString()}</p><p className="text-xs text-muted-foreground">Codeforces</p></div>
                    <div className="flex size-44 items-center justify-center rounded-full p-3" style={{ background: totalSolved > 0 ? `conic-gradient(#aa91e5 0 ${data.solves.filter((item) => item.provider === "codeforces").length / totalSolved * 100}%, #ff8b48 0 100%)` : "#34343f" }}>
                      <div className="flex size-full flex-col items-center justify-center rounded-full bg-card text-center"><span className="text-3xl font-semibold tabular-nums">{totalSolved.toLocaleString()}</span><span className="text-xs text-muted-foreground">total solved</span></div>
                    </div>
                    <div className="text-center sm:text-left"><p className="text-2xl font-semibold tabular-nums">{leetcodeSolved.toLocaleString()}</p><p className="text-xs text-muted-foreground">LeetCode</p></div>
                  </div>
                  {!data.historyComplete && cf && <p className="mt-3 text-center text-xs text-muted-foreground">Codeforces history is still syncing; this total may rise.</p>}
                </AnalyticsPanel>
                {provider !== "leetcode" && <AnalyticsPanel
                  title="Codeforces rating"
                  description="All synchronized rated contests, independent of the solve date filter."
                >
                  <p className="mb-4 text-xs text-muted-foreground">
                    {typeof cf?.summary.rating === "number" ? `Current ${cf.summary.rating} · Peak ${cf.summary.maxRating ?? "unavailable"}` : "No synchronized rating yet"}
                  </p>
                  <RatingChart history={data.ratingHistory} provider="codeforces" />
                </AnalyticsPanel>}
                <div className="grid gap-5 lg:grid-cols-2">
                  <AnalyticsPanel
                    title="Codeforces difficulty"
                    description="Unique verified accepted problems by rating band, within the selected period."
                  >
                    {provider === "leetcode" ? (
                      <p className="text-sm text-muted-foreground">
                        Switch to Codeforces or All platforms to view this
                        distribution.
                      </p>
                    ) : (
                      <Distribution items={data.difficulty} />
                    )}
                  </AnalyticsPanel>
                  <AnalyticsPanel
                    title="LeetCode distribution"
                    description="All-time public profile totals. These aggregates do not prove individual accepted solves."
                  >
                    {lc && provider !== "codeforces" ? (
                      <div className="space-y-5">
                        {[
                          ["Easy", lc.summary.easySolved, "bg-emerald-400"],
                          ["Medium", lc.summary.mediumSolved, "bg-amber-400"],
                          ["Hard", lc.summary.hardSolved, "bg-rose-400"],
                        ].map(([label, value, color]) => (
                          <div key={String(label)}>
                            <div className="mb-2 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {label}
                              </span>
                              <span className="tabular-nums">
                                {typeof value === "number"
                                  ? value.toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded bg-muted">
                              <div
                                className={`h-full rounded ${color}`}
                                style={{
                                  width:
                                    typeof value === "number" &&
                                    lc.summary.totalSolved
                                      ? `${(value / lc.summary.totalSolved) * 100}%`
                                      : "0%",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <p className="pt-2 text-xs text-muted-foreground">
                          {typeof lc.summary.totalSolved === "number"
                            ? `${lc.summary.totalSolved.toLocaleString()} platform-reported unique problems`
                            : "Total unavailable"}
                        </p>
                      </div>
                    ) : (
                      <p className="py-5 text-sm leading-6 text-muted-foreground">
                        {provider === "codeforces"
                          ? "Switch the platform filter to view LeetCode profile counts."
                          : "Connect and synchronize LeetCode to see available public profile counts."}
                      </p>
                    )}
                  </AnalyticsPanel>
                </div>
                <AnalyticsPanel
                  title="Coding activity"
                  description="Daily verified Codeforces solves in UTC. GitHub contributions and unverified aggregate activity are excluded."
                >
                  <ActivityHeatmap
                    activity={data.activity}
                    days={days}
                    complete={provider !== "leetcode" && data.historyComplete}
                  />
                </AnalyticsPanel>
                <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                  <AnalyticsPanel
                    title="Topic coverage"
                    description="Counts reflect verified problems containing each topic; one problem can belong to several topics."
                  >
                    <Distribution
                      items={data.topics
                        .slice(0, 10)
                        .map((item) => ({
                          label: item.topic,
                          count: item.count,
                        }))}
                    />
                  </AnalyticsPanel>
                  <AnalyticsPanel
                    title="Practice direction"
                    description="A transparent view of where you've practiced less."
                  >
                    {data.topics.length ? (
                      <>
                        <p className="text-sm leading-7 text-muted-foreground">
                          Your least represented tracked topics in this period
                          are{" "}
                          <span className="text-foreground">
                            {data.topics
                              .slice(-3)
                              .map((item) => item.topic)
                              .join(", ")}
                          </span>
                          .
                        </p>
                        <p className="mt-3 text-xs leading-6 text-muted-foreground">
                          This compares counts among topics in your verified
                          solve history. It is a practice signal, not a claim
                          about skill or mastery.
                        </p>
                        <Link
                          href="/training"
                          className="mt-6 inline-flex items-center gap-1 text-sm text-primary"
                        >
                          Choose a focused track
                          <ArrowUpRight size={14} />
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm leading-6 text-muted-foreground">
                        As you synchronize accepted solves, this section will
                        highlight the topics represented least in your practice.
                      </p>
                    )}
                  </AnalyticsPanel>
                </div>
                <AnalyticsPanel
                  title="Coins analytics"
                  description="Each unique eligible problem earns one initial award. All amounts come from the authoritative ledger."
                >
                  <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    {[
                      ["Total balance", data.overview.chakra],
                      ["This week · UTC", data.overview.chakraWeek],
                      ["This month · UTC", data.overview.chakraMonth],
                    ].map(([title, value]) => (
                      <div key={String(title)} className="border-b pb-4">
                        <p className="text-xs text-muted-foreground">{title}</p>
                        <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums text-primary">
                          <ChakraMark className="size-[18px]" variant="small" />
                          {Number(value).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <ChakraChart data={data.chakraHistory} />
                  <div className="mt-6 grid gap-6 border-t pt-5 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-xs font-medium">
                        By provider · selected period
                      </h3>
                      <Distribution
                        items={data.chakraByProvider.map((item) => ({
                          label: item.label,
                          count: item.points,
                        }))}
                        empty="No ledger entries for this period."
                      />
                    </div>
                    <div>
                      <h3 className="mb-3 text-xs font-medium">
                        By difficulty · selected period
                      </h3>
                      <Distribution
                        items={data.chakraByDifficulty.map((item) => ({
                          label: item.label,
                          count: item.points,
                        }))}
                        empty="No eligible difficulty awards yet."
                      />
                    </div>
                  </div>
                  <p className="mt-6 text-xs leading-6 text-muted-foreground">
                    LeetCode rewards are disabled pending dependable per-problem
                    solve confirmation. Codeforces problems outside the supported
                    rating brackets do not earn coins.
                  </p>
                </AnalyticsPanel>
                <AnalyticsPanel
                  title="College and society"
                  description="Membership and rankings require real, eligible participants."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">College</p>
                      <p className="mt-2 text-sm">
                        {account.data?.profile.colleges?.name ??
                          "College not selected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Society</p>
                      <p className="mt-2 text-sm">
                        {account.data?.memberships.find(
                          (item) => item.status === "active",
                        )?.societies?.name ??
                          (account.data?.memberships.length
                            ? "Membership request pending"
                            : "Not joined")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/leaderboards"
                    className="mt-6 inline-flex items-center gap-1 text-sm text-primary"
                  >
                    View eligible peer rankings
                    <ArrowUpRight size={14} />
                  </Link>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Rankings show their metric, scoring period, qualifying
                    population, and refresh time.
                  </p>
                </AnalyticsPanel>
              </>
            ) : (
              <div className="rounded-md border p-8 text-sm text-muted-foreground">
                Statistics are unavailable until your account data can be
                loaded. Use Retry above.
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
