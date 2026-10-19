"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Code2,
  ExternalLink,
  Globe,
  GraduationCap,
  MapPin,
  Settings,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { MeasuredChartContainer as ResponsiveContainer } from "./MeasuredChartContainer";
import { SiGithub, SiLinkedin, SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { ChakraMark } from "@/components/brand/ChakraMark";
import { ConnectedProfilesPanel } from "@/components/auth/ConnectedProfilesPanel";
import "./portfolio.css";
import { RatingChart, Distribution } from "./Charts";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { activityStreaks } from "@/lib/activity-streaks";
import { countryLabel } from "@/lib/countries";
import type { AccountState } from "@/hooks/use-account";
import type { TrackerData, ProviderSnapshot } from "@/lib/tracker-types";
import type { VerifiedProfile } from "@/lib/profile-verification";
export interface PortfolioData {
  profile: Partial<AccountState["profile"]>;
  accounts: VerifiedProfile[];
  snapshots: Array<
    Pick<
      ProviderSnapshot,
      "provider" | "summary" | "last_synced_at" | "history_complete"
    >
  >;
  historyComplete: boolean;
  overview: Pick<
    TrackerData["overview"],
    "verifiedSolves" | "activeDays" | "chakra"
  >;
  activity: TrackerData["activity"];
  ratingHistory: TrackerData["ratingHistory"];
  topics: TrackerData["topics"];
  solves?: TrackerData["solves"];
  ledger?: TrackerData["ledger"];
}
const format = (value: number | null | undefined) =>
  typeof value === "number"
    ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "—";
function Section({
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
    <section className={`min-w-0 rounded-lg border bg-card p-5 ${className}`}>
      <h2 className="text-sm font-medium">{title}</h2>
      {description && (
        <p className="mb-5 mt-2 text-[11px] leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}
function DifficultyRing({
  items,
  total,
}: {
  items: Array<{
    name: string;
    value: number | null | undefined;
    color: string;
  }>;
  total: number | null | undefined;
}) {
  const known = items.filter(
    (item) => typeof item.value === "number" && item.value > 0,
  );
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">
          {format(total)}
        </div>
        {known.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={known}
                dataKey="value"
                innerRadius={48}
                outerRadius={59}
                startAngle={90}
                endAngle={450}
                stroke="none"
                isAnimationActive={false}
              >
                {known.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-2 rounded-full border-[10px] border-muted" />
        )}
      </div>
      <dl className="flex-1 space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <dt style={{ color: item.color }}>{item.name}</dt>
            <dd className="tabular-nums">{format(item.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function Portfolio({
  data,
  owner = false,
}: {
  data: PortfolioData;
  owner?: boolean;
}) {
  const [tab, setTab] = useState("overview");
  const [heatmapDays, setHeatmapDays] = useState(365);
  const [allTopics, setAllTopics] = useState(false);
  const { profile } = data;
  const cf = data.snapshots.find((item) => item.provider === "codeforces");
  const lc = data.snapshots.find((item) => item.provider === "leetcode");
  const totalSolves = (data.overview.verifiedSolves ?? 0) + (lc?.summary.totalSolved ?? 0);
  const streaks = activityStreaks(data.activity);
  const milestones = [1, 100, 500, 1000].filter(
    (value) =>
      data.historyComplete && (data.overview.verifiedSolves ?? 0) >= value,
  );
  const tabs = [
    ["overview", "Overview"],
    ["statistics", "Statistics"],
    ...(owner
      ? [
          ["solves", "Solved Problems"],
          ["chakra", "Coins History"],
        ]
      : []),
  ];
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="portfolio-identity overflow-hidden rounded-xl border bg-card">
        <div className="portfolio-cover flex items-center justify-between gap-3 px-5 py-3">
          <span className="text-[10px] font-semibold tracking-[.16em]">ALGOGYM / PROFILE</span>
          <Globe size={13} className="text-muted-foreground" />
        </div>
        <div className="portfolio-identity-body p-5">
          <div className="portfolio-portrait-row">
            <span className="portfolio-portrait grid size-24 place-items-center overflow-hidden rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              ) : (
                (profile.display_name ?? profile.username ?? "A")
                  .slice(0, 1)
                  .toUpperCase()
              )}
            </span>
            {owner && (
              <Link
                href="/settings"
                aria-label="Edit profile"
                className="rounded border p-2 text-muted-foreground hover:text-foreground"
              >
                <Settings size={14} />
              </Link>
            )}
          </div>
          <h1 className="mt-4 break-words text-center text-xl font-semibold tracking-tight">
            {profile.display_name ?? profile.username ?? "AlgoGym member"}
          </h1>
          {profile.username && (
            <p className="mt-1 text-center text-xs text-[#f2a56d]">@{profile.username}</p>
          )}
          <p className="mt-4 whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">
            {profile.bio ||
              (owner
                ? "Tell your story. Add a short bio in your profile settings."
                : "Competitive programmer on AlgoGym.")}
          </p>
          <div className="mt-4 flex justify-center gap-4">
            {[
              [profile.website_url, Globe, "Website"],
              [profile.github_url, SiGithub, "GitHub"],
              [profile.linkedin_url, SiLinkedin, "LinkedIn"],
              [profile.x_url, SiX, "X"],
            ]
              .filter(([url]) => Boolean(url))
              .map(([url, Icon, label]) => {
                const Mark = Icon as typeof Globe;
                return (
                  <a
                    key={String(label)}
                    href={String(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${String(label)} profile`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Mark size={16} />
                  </a>
                );
              })}
          </div>
          <div className="mt-5 space-y-3 border-y py-4 text-[11px] text-muted-foreground">
            {profile.country_code && (
              <p className="flex items-center gap-2">
                <MapPin size={14} />
                {countryLabel(profile.country_code)}
              </p>
            )}
            <p className="flex items-start gap-2">
              <GraduationCap size={15} className="mt-0.5 shrink-0" />
              <span>
                {profile.colleges?.name ?? "College not specified"}
                {profile.academic_year && (
                  <span className="mt-1 block text-[10px]">
                    {profile.academic_year}
                  </span>
                )}
              </span>
            </p>
          </div>
          <ConnectedProfilesPanel profiles={data.accounts} owner={Boolean(owner)} />
          {owner && (
            <Button asChild size="sm" variant="outline" className="mt-6 w-full">
              <Link href="/profile/card">
                <Share2 size={13} />
                Your AlgoGym card
              </Link>
            </Button>
          )}
          {profile.username && owner && (
            <Link
              href={`/u/${profile.username}`}
              className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground"
            >
              View public portfolio
              <ArrowUpRight size={11} />
            </Link>
          )}
        </div>
      </aside>
      <div className="min-w-0 space-y-5">
        <nav
          aria-label="Portfolio views"
          className="flex gap-1 overflow-x-auto border-b pb-3"
        >
          {tabs.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              aria-current={tab === value ? "page" : undefined}
              className={`shrink-0 rounded-md px-4 py-2 text-xs ${tab === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        {(tab === "overview" || tab === "statistics") && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-3">
                <Section title="Total solves">
                  <p className="mt-4 text-3xl font-semibold tabular-nums">
                    {format(totalSolves)}
                  </p>
                  <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                    Codeforces history and LeetCode profile
                  </p>
                </Section>
                <Section title="Active days">
                  <p className="mt-4 text-3xl font-semibold tabular-nums">
                    {format(data.overview.activeDays)}
                  </p>
                  <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                    Accepted solve days · UTC
                  </p>
                </Section>
              </div>
              <Section title="Coins">
                <p className="mt-4 flex items-center gap-2 text-3xl font-semibold tabular-nums text-primary">
                  <ChakraMark className="size-[22px]" variant="main" />
                  {format(data.overview.chakra)}
                </p>
                <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                  Authoritative ledger balance · eligible accepted solves
                </p>
              </Section>
            </div>
            <Section
              title="Coding activity"
              description="Daily verified Codeforces solves; public profile totals and GitHub contributions are separate."
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-4 text-[11px] text-muted-foreground">
                  <span>
                    Current streak{" "}
                    <strong className="ml-1 font-medium text-foreground">
                      {data.historyComplete ? streaks.current : "—"}
                    </strong>
                  </span>
                  <span>
                    Longest{" "}
                    <strong className="ml-1 font-medium text-foreground">
                      {data.historyComplete ? streaks.maximum : "—"}
                    </strong>
                  </span>
                </div>
                <label className="text-[11px] text-muted-foreground">
                  Activity period
                  <select
                    className="ml-2 rounded border bg-background px-2 py-1"
                    value={heatmapDays}
                    onChange={(event) =>
                      setHeatmapDays(Number(event.target.value))
                    }
                  >
                    <option value={365}>Last year</option>
                    <option value={90}>Last 90 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                </label>
              </div>
              <ActivityHeatmap
                activity={data.activity}
                days={heatmapDays}
                complete={data.historyComplete}
              />
            </Section>
            <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-5">
                <Section
                  title="Contest participation"
                  description="Rated participation by platform; ratings are never combined."
                >
                  <div className="space-y-4">
                    {[cf, lc].filter(Boolean).map((snapshot) => (
                      <div
                        key={snapshot.provider}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="capitalize text-muted-foreground">
                          {snapshot.provider}
                        </span>
                        <span className="font-mono">
                          {format(snapshot.summary.ratedContests)}
                        </span>
                      </div>
                    ))}
                    {!cf && !lc && (
                      <p className="text-sm text-muted-foreground">
                        Synchronize connected accounts to see available contest
                        counts.
                      </p>
                    )}
                  </div>
                </Section>
                <Section title="Codeforces rating progression">
                  <RatingChart
                    history={data.ratingHistory}
                    provider="codeforces"
                  />
                </Section>
                <Section
                  title="Topic analysis"
                  description="Accepted solve counts per topic. Multi-topic problems count in each category."
                >
                  <Distribution
                    items={data.topics
                      .slice(0, allTopics ? undefined : 8)
                      .map((item) => ({
                        label: item.topic,
                        count: item.count,
                      }))}
                  />
                  {data.topics.length > 8 && (
                    <button
                      onClick={() => setAllTopics(!allTopics)}
                      className="mt-5 text-xs text-primary"
                    >
                      {allTopics ? "Show fewer topics" : "Show all topics"}
                    </button>
                  )}
                </Section>
              </div>
              <div className="space-y-5">
                <Section
                  title="LeetCode difficulty"
                  description="Public, platform-reported unique problem totals; not individual solve evidence."
                >
                  {lc ? (
                    <DifficultyRing
                      total={lc.summary.totalSolved}
                      items={[
                        {
                          name: "Easy",
                          value: lc.summary.easySolved,
                          color: "#4cba91",
                        },
                        {
                          name: "Medium",
                          value: lc.summary.mediumSolved,
                          color: "#d5b057",
                        },
                        {
                          name: "Hard",
                          value: lc.summary.hardSolved,
                          color: "#d26b78",
                        },
                      ]}
                    />
                  ) : (
                    <p className="py-4 text-xs leading-6 text-muted-foreground">
                      Connect and synchronize LeetCode to view available counts.
                    </p>
                  )}
                </Section>
                <Section
                  title="Contest ratings"
                  description="Current and peak values are provider-specific."
                >
                  <div className="space-y-5">
                    {[cf, lc].filter(Boolean).map((snapshot) => (
                      <div
                        key={snapshot.provider}
                        className="border-b pb-4 last:border-0 last:pb-0"
                      >
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {snapshot.provider}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums">
                          {format(snapshot.summary.rating)}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {snapshot.provider === "codeforces"
                            ? `Peak ${format(snapshot.summary.maxRating)}`
                            : "Public contest rating"}
                        </p>
                      </div>
                    ))}
                    {!cf && !lc && (
                      <p className="text-xs text-muted-foreground">
                        No synchronized contest ratings yet.
                      </p>
                    )}
                  </div>
                </Section>
                <Section
                  title="Verified milestones"
                  description="Milestones use real unique accepted-problem counts."
                >
                  {milestones.length ? (
                    <div className="space-y-4">
                      {milestones.map((value) => (
                        <p
                          key={value}
                          className="flex items-center gap-3 text-xs"
                        >
                          <span className="grid size-7 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                            <Check size={14} />
                          </span>
                          {value === 1
                            ? "First verified problem"
                            : `${value.toLocaleString()} verified problems`}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs leading-6 text-muted-foreground">
                      Your confirmed practice milestones will appear here.
                    </p>
                  )}
                </Section>
              </div>
            </div>
          </>
        )}
        {tab === "solves" && (
          <Section
            title="Solved problems"
            description="Unique accepted problems from the synchronized server archive. Manual study markers are excluded."
          >
            {data.solves?.length ? (
              <div className="max-h-[700px] overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 font-medium">Problem</th>
                      <th className="py-3 font-medium">Difficulty</th>
                      <th className="py-3 font-medium">Accepted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.solves]
                      .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt))
                      .map((solve) => (
                        <tr key={solve.id} className="border-b">
                          <td className="py-4 pr-3">
                            <a
                              href={solve.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary"
                            >
                              {solve.title}
                              <ExternalLink size={10} className="ml-1 inline" />
                            </a>
                            <p className="mt-1 text-[10px] capitalize text-muted-foreground">
                              {solve.provider}
                            </p>
                          </td>
                          <td className="py-4 pr-3 text-muted-foreground">
                            {solve.rating ?? solve.difficulty ?? "Unrated"}
                          </td>
                          <td className="whitespace-nowrap py-4 text-muted-foreground">
                            {solve.acceptedAt.slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-10 text-sm text-muted-foreground">
                No verified accepted problems are available yet.
              </p>
            )}
          </Section>
        )}
        {tab === "chakra" && (
          <Section
            title="Coins history"
            description="Immutable grants and compensating adjustments from your server ledger."
          >
            {data.ledger?.length ? (
              <ol className="max-h-[700px] divide-y overflow-auto">
                {[...data.ledger]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div>
                        <p className="text-xs capitalize">
                          {entry.provider ?? "Ledger adjustment"}
                          {entry.difficulty ? ` · ${entry.difficulty}` : ""}
                        </p>
                        <time
                          className="mt-1 block text-[10px] text-muted-foreground"
                          dateTime={entry.createdAt}
                        >
                          {new Date(entry.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <span className="font-mono text-sm text-primary">
                        {entry.delta > 0 ? "+" : ""}
                        {entry.delta} Coins
                      </span>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="py-10 text-sm leading-6 text-muted-foreground">
                No coin entries yet. Eligible accepted Codeforces solves earn
                one initial award per problem, including problems solved before
                you joined. Repeated solves do not produce extra awards.
              </p>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
