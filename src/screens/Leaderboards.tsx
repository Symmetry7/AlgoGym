"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CollegeAutocomplete } from "@/components/auth/CollegeAutocomplete";
import { useAccount, jsonRequest, type College } from "@/hooks/use-account";
import { countryCodes, countryLabel } from "@/lib/countries";
import { useAuth } from "@/contexts/AuthContext";
interface Entry {
  rank: number;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  college: string | null;
  slug: string | null;
  score: number;
  eligibleCount: number;
}
interface Rankings {
  scope: string;
  metric: string;
  computedAt: string;
  sourceUpdatedAt: string | null;
  participantCount: number;
  entries: Entry[];
  podium: Entry[];
  myEntry: Entry | null;
  methodology: string;
  minimumEligible: number;
  topK: number | null;
}
const metrics = [
  ["chakra", "Coins", "Coins"],
  ["unique_solves", "Total solves", "Problems"],
  ["leetcode_rating", "LeetCode rating", "Rating"],
  ["codeforces_rating", "Codeforces rating", "Rating"],
];
export default function Leaderboards() {
  const { user } = useAuth();
  const account = useAccount();
  const preference = useQuery({ queryKey:["leaderboard-college",user?.id], queryFn:()=>jsonRequest<{college:College|null}>("/api/leaderboards/preference"), enabled:Boolean(user), retry:1 });
  const [scope, setScope] = useState("individual");
  const [metric, setMetric] = useState("chakra");
  const [period, setPeriod] = useState("all");
  const [filter, setFilter] = useState("global");
  const [country, setCountry] = useState("IN");
  const [college, setCollege] = useState<College | null>(null);
  const [society, setSociety] = useState("");
  const [page, setPage] = useState(0);
  const [preferenceError, setPreferenceError] = useState("");
  const selectedInitialCollege = useRef(false);
  useEffect(() => {
    if (selectedInitialCollege.current || (!preference.data && !(preference.isError && account.data))) return;
    selectedInitialCollege.current = true;
    const saved = account.data?.profile.colleges;
    setCollege(preference.data?.college ?? (account.data?.profile.college_id && saved ? { ...saved, id: account.data.profile.college_id } : null));
    setFilter("college");
  }, [preference.data, preference.isError, account.data]);
  const selectCollege = async (value: College | null) => {
    setCollege(value);
    setPage(0);
    setPreferenceError("");
    if (!user) return;
    try { await jsonRequest("/api/leaderboards/preference", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({collegeId:value?.id??null}) }); }
    catch (reason) { setPreferenceError(reason instanceof Error ? reason.message : "College selection could not be saved."); }
  };
  const params = new URLSearchParams({
    scope,
    metric,
    offset: String(page * 50),
  });
  const supportsPeriod = scope === "individual" && metric === "unique_solves" && filter !== "country";
  if (supportsPeriod) params.set("period", period);
  if (filter === "country") params.set("country", country);
  if (filter === "college" && college) params.set("collegeId", college.id);
  if (filter === "society" && society) params.set("societyId", society);
  const ready = !(
    (filter === "college" && !college) ||
    (filter === "society" && !society)
  );
  const query = useQuery({
    queryKey: ["rankings", user?.id, params.toString()],
    queryFn: () => jsonRequest<Rankings>(`/api/leaderboards?${params}`),
    enabled: ready,
    staleTime: 30000,
    retry: 1,
  });
  const societies = useQuery({
    queryKey: ["societies-for-ranking"],
    queryFn: () =>
      jsonRequest<{
        societies: Array<{
          id: string;
          name: string;
          colleges: { name: string } | null;
        }>;
      }>("/api/societies"),
    enabled: filter === "society",
    staleTime: 60000,
  });
  const data = query.data;
  const unit = metrics.find(([value]) => value === metric)?.[2] ?? "Score";
  const entryName = (entry: Entry) =>
    entry.username ? (
      <Link href={`/u/${entry.username}`} className="hover:text-primary">
        {entry.name}
      </Link>
    ) : entry.slug ? (
      <Link href={`/societies/${entry.slug}`} className="hover:text-primary">
        {entry.name}
      </Link>
    ) : (
      entry.name
    );
  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="mb-2 text-xs text-muted-foreground">
            Progress in good company
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Leaderboards
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real, verified progress. Separate metrics. Transparent eligibility.
          </p>
        </header>
        {preferenceError && <p role="alert" className="text-xs text-destructive">{preferenceError}</p>}
        <nav
          className="flex gap-1 overflow-x-auto border-b pb-3"
          aria-label="Ranked entities"
        >
          {[
            ["individual", "Programmers"],
            ["society", "Societies"],
            ["college", "Colleges"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setScope(value);
                setPage(0);
              }}
              aria-current={scope === value ? "page" : undefined}
              className={`rounded-md px-4 py-2 text-xs ${scope === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2" aria-label="Ranking metric">
          {metrics.map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setMetric(value);
                setPage(0);
              }}
              aria-pressed={metric === value}
              className={`rounded-md border px-3 py-2 text-xs ${metric === value ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {supportsPeriod && <div className="flex gap-1" aria-label="Time period">{[["week","This week"],["month","This month"],["all","All time"]].map(([value,label])=><button key={value} aria-pressed={period===value} onClick={()=>{setPeriod(value);setPage(0);}} className={`rounded-md border px-3 py-2 text-xs ${period===value?"border-primary/40 bg-primary/10 text-primary":"text-muted-foreground hover:bg-muted"}`}>{label}</button>)}</div>}
        <div className="flex flex-wrap items-start gap-3">
          <label>
            <span className="mb-2 block text-[11px] text-muted-foreground">
              Population
            </span>
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(0);
              }}
              className="h-10 rounded-md border bg-card px-3 text-xs"
            >
              <option value="global">Global</option>
              <option value="country">Country</option>
              <option value="college">College</option>
              <option value="society">Society members</option>
            </select>
          </label>
          {filter === "country" && (
            <label className="min-w-52">
              <span className="mb-2 block text-[11px] text-muted-foreground">
                Self-declared country
              </span>
              <select
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-md border bg-card px-3 text-xs"
              >
                {countryCodes
                  .map((code) => ({ code, label: countryLabel(code) }))
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {filter === "college" && (
            <div className="min-w-64 max-w-xl flex-1">
              <p className="mb-2 text-[11px] text-muted-foreground">
                Canonical college
              </p>
              <CollegeAutocomplete
                value={college}
                onSelect={(value) => void selectCollege(value)}
              />
            </div>
          )}
          {filter === "society" && (
            <label className="min-w-64">
              <span className="mb-2 block text-[11px] text-muted-foreground">
                Approved society
              </span>
              <select
                value={society}
                onChange={(event) => {
                  setSociety(event.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-md border bg-card px-3 text-xs"
              >
                <option value="">
                  {societies.isLoading
                    ? "Loading societies…"
                    : "Choose a society"}
                </option>
                {societies.data?.societies.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.colleges?.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {!ready ? (
          <div className="rounded-lg border p-8 text-sm text-muted-foreground">
            Choose{" "}
            {filter === "college"
              ? "a college from the directory"
              : "an approved society"}{" "}
            to see this ranking.
          </div>
        ) : query.isLoading ? (
          <div
            role="status"
            aria-label="Calculating leaderboard"
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((value) => (
                <div
                  key={value}
                  className="h-36 animate-pulse rounded-lg border bg-card"
                />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-lg border bg-card" />
          </div>
        ) : query.error ? (
          <div role="alert" className="rounded-lg border p-6">
            <p className="text-sm text-rose-300">{query.error.message}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void query.refetch()}
              className="mt-4"
            >
              Retry ranking
            </Button>
          </div>
        ) : data ? (
          <>
            {data.podium.length > 0 && (
              <section
                aria-label="Top ranked participants"
                className={`grid gap-px overflow-hidden rounded-lg border bg-border ${data.podium.length === 3 ? "sm:grid-cols-3" : data.podium.length === 2 ? "sm:grid-cols-2" : ""}`}
              >
                {data.podium.map((entry) => (
                  <article key={entry.rank} className="flex min-w-0 items-center gap-3 bg-card px-4 py-4">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full border font-mono text-xs ${entry.rank === 1 ? "border-amber-500/40 text-amber-400" : "text-muted-foreground"}`}>{entry.rank}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{entryName(entry)}</p><p className="truncate text-[10px] text-muted-foreground">{entry.college ?? (entry.username ? `@${entry.username}` : "Community")}</p></div>
                    <span className="shrink-0 font-mono text-sm font-medium tabular-nums">{Number(entry.score).toLocaleString(undefined,{maximumFractionDigits:2})}</span>
                  </article>
                ))}
              </section>
            )}
            {data.myEntry ? (
              <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 p-5">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-primary">
                    Your position
                  </p>
                  <p className="text-sm font-medium">{data.myEntry.name}</p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{unit}</p>
                    <p className="mt-1 font-mono text-lg">
                      {Number(data.myEntry.score).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Rank</p>
                    <p className="mt-1 font-mono text-lg">
                      #{data.myEntry.rank}
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              user && (
                <p className="rounded-md border p-4 text-xs leading-6 text-muted-foreground">
                  Your account or group does not meet this metric’s eligibility in the selected population.{" "}
                  <Link href="/settings" className="text-primary">
                    Profile settings
                  </Link>
                </p>
              )
            )}
            <section className="overflow-hidden rounded-lg border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <h2 className="text-sm font-medium">
                  {filter === "global"
                    ? "Global"
                    : filter === "country"
                      ? countryLabel(country)
                      : filter === "college"
                        ? college?.name
                        : "Society"}{" "}
                  ranking
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  {data.participantCount.toLocaleString()} eligible{" "}
                  {scope === "individual"
                    ? "programmers"
                    : scope === "society"
                      ? "societies"
                      : "colleges"}
                </p>
              </div>
              {data.entries.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-xs">
                    <thead className="border-b text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Rank</th>
                        <th className="px-4 py-3 font-medium">
                          {scope === "individual" ? "Programmer" : "Community"}
                        </th>
                        <th className="px-4 py-3 font-medium">Institution</th>
                        <th className="px-4 py-3 text-right font-medium">
                          {unit}
                        </th>
                        {scope !== "individual" && (
                          <th className="px-4 py-3 text-right font-medium">
                            Eligible
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map((entry) => (
                        <tr
                          key={entry.rank}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-4 font-mono text-muted-foreground">
                            #{entry.rank}
                          </td>
                          <td className="px-4 py-4 font-medium">
                            {entryName(entry)}
                            {entry.username && (
                              <p className="mt-1 text-[10px] font-normal text-muted-foreground">
                                @{entry.username}
                              </p>
                            )}
                          </td>
                          <td className="max-w-64 px-4 py-4 text-muted-foreground">
                            {entry.college ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono">
                            {Number(entry.score).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          {scope !== "individual" && (
                            <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                              {entry.eligibleCount}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-14 text-center">
                  <Trophy
                    size={25}
                    className="mx-auto mb-4 text-muted-foreground"
                  />
                  <p className="text-sm font-medium">
                    No eligible participants yet.
                  </p>
                  <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-muted-foreground">
                    {data.methodology}
                  </p>
                </div>
              )}
            </section>
            {data.participantCount > 50 && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={13} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * 50 >= data.participantCount}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight size={13} />
                </Button>
              </div>
            )}
            <details className="rounded-lg border p-4 text-[11px] leading-6 text-muted-foreground">
              <summary className="cursor-pointer text-foreground">
                How rankings work
              </summary>
              <p className="mt-3">{data.methodology}</p>
              <p className="mt-2">
                Calculated {new Date(data.computedAt).toLocaleString()}.
                {data.sourceUpdatedAt
                  ? ` Oldest eligible source update: ${new Date(data.sourceUpdatedAt).toLocaleString()}.`
                  : ""}{" "}
                Each platform rating stays separate. Coins replaces the
                reference product’s proprietary C Score.
              </p>
            </details>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
