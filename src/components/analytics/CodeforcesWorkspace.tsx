"use client";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MeasuredChartContainer as ResponsiveContainer } from "./MeasuredChartContainer";
import { useCodeforcesCatalog as useCatalog } from "@/hooks/use-codeforces-catalog";
import { jsonRequest } from "@/hooks/use-account";
import { useAuth } from "@/contexts/AuthContext";
import {
  filterSubmissions,
  submissionSummary,
  toCSV,
  verdictLabels,
  rankBands,
  type CFStatistics,
  type CFSubmission,
  type CFRating,
  type SubmissionFilter,
} from "@/lib/codeforces-analytics";
import { Distribution } from "./Charts";
import type { Problem } from "@/lib/types";
export type StatisticsView =
  | "overview"
  | "submissions"
  | "problems"
  | "rating"
  | "timeline";
const input =
  "h-9 w-full rounded-md border bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const panel = "min-w-0 rounded-lg border bg-card p-5 sm:p-6";
const tooltipStyle = {
  background: "#151820",
  border: "1px solid #303746",
  borderRadius: 6,
  fontSize: 12,
  color: "#E8EDF5",
};
const fmt = (value: number | null | undefined, suffix = "") =>
  typeof value === "number"
    ? `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`
    : "—";
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b pb-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 break-words text-xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>
        {total.toLocaleString()} results · Page {page + 1} of{" "}
        {Math.max(1, Math.ceil(total / 50))}
      </span>
      <div className="flex gap-2">
        <button
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          className="rounded border p-2 disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          aria-label="Next page"
          disabled={(page + 1) * 50 >= total}
          onClick={() => onChange(page + 1)}
          className="rounded border p-2 disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
function Outcome({ verdict }: { verdict: string }) {
  return (
    <span
      className={`font-mono text-[11px] ${verdict === "OK" ? "text-emerald-400" : verdict === "TESTING" ? "text-amber-400" : "text-rose-400"}`}
      title={verdict.replaceAll("_", " ")}
    >
      {verdictLabels[verdict] ?? verdict}
    </span>
  );
}
export function CodeforcesWorkspace({
  view,
  days,
  syncing,
}: {
  view: Exclude<StatisticsView, "overview">;
  days: number;
  syncing: boolean;
}) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["cf-statistics", user?.id],
    queryFn: () => jsonRequest<CFStatistics>("/api/statistics"),
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchInterval: syncing ? 5000 : false,
  });
  const data = query.data;
  const since = days ? Date.now() - days * 86400000 : 0;
  const rows = useMemo(
    () =>
      data?.submissions.filter((row) => Date.parse(row.date) >= since) ?? [],
    [data, days],
  );
  const ratings = useMemo(
    () => data?.ratings.filter((row) => Date.parse(row.date) >= since) ?? [],
    [data, days],
  );
  if (query.isLoading)
    return (
      <div
        role="status"
        className="h-96 animate-pulse rounded-lg border bg-card"
        aria-label="Loading Codeforces record"
      />
    );
  if (query.error)
    return (
      <div className={panel} role="alert">
        <p className="text-sm">{query.error.message}</p>
        <button
          onClick={() => void query.refetch()}
          className="mt-4 text-sm text-primary"
        >
          Retry loading history
        </button>
      </div>
    );
  if (!data?.handle)
    return (
      <div className={panel}>
        <h2 className="font-medium">Connect Codeforces to read your record</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          These views use the public history of your verified linked account.
        </p>
        <a
          href="/onboarding?step=3"
          className="mt-5 inline-block text-sm text-primary"
        >
          Connect a coding profile
        </a>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          Codeforces dossier{" "}
          <span className="ml-2 font-mono text-foreground">{data.handle}</span>
        </p>
        <p>
          {data.lastSyncedAt
            ? `Updated ${new Date(data.lastSyncedAt).toLocaleString()}`
            : "Awaiting first synchronization"}
        </p>
      </div>
      {!data.complete && (
        <p
          role="status"
          className="rounded-md border border-amber-400/25 bg-amber-400/5 p-4 text-xs leading-6 text-amber-200"
        >
          Full submission history is still being imported. Counts below cover
          available records and may increase. Use Synchronize above to start or
          resume an import.
        </p>
      )}
      {view === "submissions" ? (
        <Submissions rows={rows} />
      ) : view === "problems" ? (
        <ProblemLadder
          submissions={data.submissions}
          rating={data.ratings.at(-1)?.rating ?? null}
          complete={data.complete}
        />
      ) : view === "rating" ? (
        <RatedHistory ratings={ratings} />
      ) : (
        <ContestTimeline
          ratings={ratings}
          submissions={data.submissions}
          userId={user?.id}
        />
      )}
    </div>
  );
}
function Submissions({ rows }: { rows: CFSubmission[] }) {
  const [filter, setFilter] = useState<SubmissionFilter>({
    verdict: "",
    min: "",
    max: "",
    tag: "",
    language: "",
    search: "",
  });
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () => filterSubmissions(rows, filter),
    [rows, filter],
  );
  const summary = useMemo(() => submissionSummary(filtered), [filtered]);
  const maxTempo = Math.max(1, ...summary.tempo.map((item) => item.count));
  const tags = [...new Set(rows.flatMap((row) => row.tags))].sort();
  const languages = [
    ...new Set(rows.flatMap((row) => (row.language ? [row.language] : []))),
  ].sort();
  const update = (key: keyof SubmissionFilter, value: string) => {
    setFilter((current) => ({ ...current, [key]: value }));
    setPage(0);
  };
  useEffect(() => setPage(0), [rows]);
  const exportCSV = () => {
    const blob = new Blob(["\uFEFF" + toCSV(filtered)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "algogym-codeforces-submissions.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Submission log
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Every attempt tells a story.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Find where wrong answers cluster. Filter your attempts by verdict,
              difficulty, topic, and language.
            </p>
          </div>
          <button
            disabled={!filtered.length}
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <Metric
            label="AC rate · filtered attempts"
            value={fmt(summary.acRate, "%")}
          />
          <Metric
            label="Attempts per unique solve"
            value={fmt(summary.attemptsPerSolve)}
          />
          <Metric
            label="Fastest accepted runtime"
            value={fmt(summary.fastest, " ms")}
          />
          <Metric
            label="Most failed tag"
            value={summary.failedTags[0]?.[0] ?? "—"}
          />
        </div>
        <div className="mt-6">
          <div className="mb-3 flex justify-between text-[11px] text-muted-foreground">
            <span>Last 60 outcomes · selected period</span>
            <span>Newest right</span>
          </div>
          <div
            className="flex h-7 gap-1"
            aria-label="Recent submission outcomes"
          >
            {rows
              .slice(0, 60)
              .reverse()
              .map((row) => (
                <a
                  key={row.id}
                  href={`https://codeforces.com/contest/${row.contestId}/submission/${row.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-w-1 flex-1 rounded-sm focus-visible:ring-2 focus-visible:ring-ring ${row.verdict === "OK" ? "bg-emerald-500/65" : row.verdict === "TESTING" ? "bg-amber-400/60" : "bg-rose-500/55"}`}
                  aria-label={`${row.title}, ${verdictLabels[row.verdict] ?? row.verdict}, ${new Date(row.date).toLocaleString()}`}
                  title={`${row.title} · ${verdictLabels[row.verdict] ?? row.verdict} · ${new Date(row.date).toLocaleString()}`}
                />
              ))}
            {!rows.length && <div className="w-full rounded bg-muted" />}
          </div>
        </div>
      </section>
      <section className={panel}>
        <h3 className="text-sm font-medium">Practice tempo</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Submission attempts per active date · filtered results · UTC
        </p>
        {summary.tempo.length ? (
          <div
            className="mt-5"
            role="img"
            aria-label={`Daily submission volume across ${summary.tempo.length} active dates`}
          >
            <div className={`flex h-40 items-end gap-1 overflow-x-auto border-b border-[#34343f] pb-1 ${summary.tempo.length <= 3 ? "justify-center" : ""}`}>
              {summary.tempo.map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.count} submission ${day.count === 1 ? "attempt" : "attempts"}`}
                  className="min-w-2 max-w-7 flex-1 rounded-t-sm bg-[#8e77c6] transition-colors hover:bg-[#b8a0f4]"
                  style={{ height: `${Math.max(4, day.count / maxTempo * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{summary.tempo[0].date}</span>{summary.tempo.length > 1 && <span>{summary.tempo.at(-1)?.date}</span>}</div>
          </div>
        ) : (
          <p className="py-8 text-sm text-muted-foreground">
            No attempts match these filters.
          </p>
        )}
      </section>
      <section className={panel}>
        <div className="mb-5 flex flex-wrap gap-1" aria-label="Verdict filter">
          {[
            ["", "All"],
            ["OK", "AC"],
            ["WRONG_ANSWER", "WA"],
            ["TIME_LIMIT_EXCEEDED", "TLE"],
            ["RUNTIME_ERROR", "RE"],
            ["MEMORY_LIMIT_EXCEEDED", "MLE"],
            ["COMPILATION_ERROR", "CE"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter.verdict === value}
              onClick={() => update("verdict", value)}
              className={`rounded-md px-3 py-2 text-xs ${filter.verdict === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <label className="col-span-2 text-[11px] text-muted-foreground">
            Search problem
            <input
              value={filter.search}
              onChange={(event) => update("search", event.target.value)}
              placeholder="Title or problem ID"
              className={`${input} mt-1.5`}
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Minimum rating
            <input
              type="number"
              min={800}
              max={3500}
              step={100}
              value={filter.min}
              onChange={(event) => update("min", event.target.value)}
              placeholder="Any"
              className={`${input} mt-1.5`}
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Maximum rating
            <input
              type="number"
              min={800}
              max={3500}
              step={100}
              value={filter.max}
              onChange={(event) => update("max", event.target.value)}
              placeholder="Any"
              className={`${input} mt-1.5`}
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Topic
            <select
              value={filter.tag}
              onChange={(event) => update("tag", event.target.value)}
              className={`${input} mt-1.5`}
            >
              <option value="">Any topic</option>
              {tags.map((tag) => (
                <option key={tag}>{tag}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-muted-foreground">
            Language
            <select
              value={filter.language}
              onChange={(event) => update("language", event.target.value)}
              className={`${input} mt-1.5`}
            >
              <option value="">Any language</option>
              {languages.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </label>
        </div>
        {filter.min &&
          filter.max &&
          Number(filter.min) > Number(filter.max) && (
            <p role="alert" className="mt-3 text-xs text-amber-400">
              Minimum rating must not exceed maximum rating.
            </p>
          )}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[770px] text-left text-xs">
            <caption className="sr-only">
              Codeforces submissions matching the selected filters
            </caption>
            <thead className="border-b text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {[
                  "Verdict",
                  "Problem",
                  "Rating",
                  "Language",
                  "Time",
                  "Memory",
                  "Date",
                ].map((label) => (
                  <th key={label} className="px-2 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(page * 50, (page + 1) * 50).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 hover:bg-muted/30"
                >
                  <td className="px-2 py-4">
                    <a
                      href={`https://codeforces.com/contest/${row.contestId}/submission/${row.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Submission ${row.id}: ${row.verdict}`}
                    >
                      <Outcome verdict={row.verdict} />
                    </a>
                  </td>
                  <td className="max-w-64 px-2 py-4">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {row.problemId.replace(":", "")}. {row.title}
                    </a>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {row.tags.join(" · ")}
                    </p>
                  </td>
                  <td className="px-2 tabular-nums">{fmt(row.rating)}</td>
                  <td className="px-2 text-muted-foreground">
                    {row.language ?? "—"}
                  </td>
                  <td className="px-2 tabular-nums text-muted-foreground">
                    {fmt(row.runtime, " ms")}
                  </td>
                  <td className="px-2 tabular-nums text-muted-foreground">
                    {row.memory === null
                      ? "—"
                      : fmt(row.memory / 1048576, " MB")}
                  </td>
                  <td className="whitespace-nowrap px-2 text-muted-foreground">
                    <time dateTime={row.date}>
                      {new Date(row.date).toLocaleString()}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="py-14 text-center text-sm text-muted-foreground">
              No submissions match the selected period and filters.
            </p>
          )}
        </div>
        <Pagination page={page} total={filtered.length} onChange={setPage} />
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel}>
          <h3 className="mb-5 text-sm font-medium">Verdict distribution</h3>
          <Distribution
            items={summary.verdicts}
            empty="No attempts in this selection."
          />
        </section>
        <section className={panel}>
          <h3 className="mb-2 text-sm font-medium">
            Topics in unsuccessful attempts
          </h3>
          <p className="mb-5 text-xs leading-5 text-muted-foreground">
            Counts attempts, not unique problems. Multi-topic attempts
            contribute to each tag.
          </p>
          <Distribution
            items={summary.failedTags
              .slice(0, 8)
              .map(([label, count]) => ({ label, count }))}
            empty="No unsuccessful attempts with public tags."
          />
        </section>
      </div>
    </>
  );
}
function ProblemLadder({
  submissions,
  rating,
  complete,
}: {
  submissions: CFSubmission[];
  rating: number | null;
  complete: boolean;
}) {
  const catalog = useCatalog();
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [unsolved, setUnsolved] = useState(false);
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(0);
  const solved = useMemo(
    () =>
      new Set(
        submissions
          .filter((row) => row.verdict === "OK")
          .map((row) => `codeforces-${row.problemId.replace(":", "")}`),
      ),
    [submissions],
  );
  const problems = catalog.problems.filter(
    (problem) => problem.platform === "codeforces",
  );
  const topics = [
    ...new Set(problems.flatMap((problem) => problem.tags)),
  ].sort();
  const filtered = useMemo(
    () =>
      problems
        .filter(
          (problem) =>
            (!unsolved || !solved.has(problem.id)) &&
            (!min ||
              (problem.rating !== undefined &&
                problem.rating >= Number(min))) &&
            (!max ||
              (problem.rating !== undefined &&
                problem.rating <= Number(max))) &&
            (!tag || problem.tags.includes(tag)) &&
            (!search ||
              `${problem.title} ${problem.id}`
                .toLowerCase()
                .includes(search.toLowerCase())),
        )
        .sort((a, b) =>
          sort === "rating"
            ? (a.rating ?? Infinity) - (b.rating ?? Infinity) ||
              (b.solvedCount ?? 0) - (a.solvedCount ?? 0)
            : (b.solvedCount ?? 0) - (a.solvedCount ?? 0),
        ),
    [catalog.problems, submissions, min, max, tag, search, unsolved, sort],
  );
  useEffect(() => setPage(0), [min, max, tag, search, unsolved, sort]);
  const bands = Array.from({ length: 28 }, (_, i) => 800 + i * 100).map(
    (value) => {
      const rung = problems.filter((problem) => problem.rating === value);
      return {
        value,
        total: rung.length,
        solved: rung.filter((problem) => solved.has(problem.id)).length,
      };
    },
  );
  const recommend = () => {
    const baseline = Math.min(
      3300,
      Math.max(800, Math.floor((rating ?? 800) / 100) * 100),
    );
    setMin(String(baseline));
    setMax(String(Math.min(3500, baseline + 200)));
    setUnsolved(true);
    setSort("rating");
    const counts = topics
      .filter((topic) => !topic.startsWith("*"))
      .map((topic) => ({
        topic,
        count: problems.filter(
          (problem) => problem.tags.includes(topic) && solved.has(problem.id),
        ).length,
      }))
      .sort((a, b) => a.count - b.count || a.topic.localeCompare(b.topic));
    setTag(counts[0]?.topic ?? "");
    setPage(0);
  };
  return (
    <>
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Problem ladder
            </p>
            <h2 className="mt-2 text-xl font-semibold">Find your next rung.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Solved coverage against the current public Codeforces catalog,
              across every rating band.
            </p>
          </div>
          <button
            disabled={!problems.length || !complete}
            onClick={recommend}
            className="rounded-md border px-3 py-2 text-xs disabled:opacity-40"
          >
            Recommended for me
          </button>
        </div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          Recommendations select unsolved problems within your current rating
          +200, using your least-practiced available topic. Without a contest
          rating, the starting band is 800.
        </p>
        {catalog.loading ? (
          <p role="status" className="py-8 text-sm text-muted-foreground">
            Loading the Codeforces catalog…
          </p>
        ) : catalog.error ? (
          <div role="alert" className="mt-5 text-sm text-rose-400">
            {catalog.error}
            <button onClick={catalog.reload} className="ml-3 underline">
              Retry catalog
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7 xl:grid-cols-14">
            {bands.map((band) => (
              <button
                key={band.value}
                onClick={() => {
                  setMin(String(band.value));
                  setMax(String(band.value));
                }}
                aria-label={`Rating ${band.value}: ${band.solved} solved of ${band.total}. Filter to this band.`}
                className="rounded-md border p-2.5 text-left hover:border-primary/50"
              >
                <p className="font-mono text-xs">{band.value}</p>
                <div className="my-3 h-1 rounded bg-muted">
                  <div
                    className="h-full rounded bg-primary"
                    style={{
                      width: band.total
                        ? `${(band.solved / band.total) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <p className="text-[10px] tabular-nums text-muted-foreground">
                  {band.solved}/{band.total}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {band.total
                    ? `${((band.solved / band.total) * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
      <section className={panel}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <label className="col-span-2 text-[11px] text-muted-foreground">
            Search
            <input
              className={`${input} mt-1.5`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Problem title or ID"
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Minimum rating
            <input
              className={`${input} mt-1.5`}
              type="number"
              min={800}
              max={3500}
              step={100}
              value={min}
              onChange={(event) => setMin(event.target.value)}
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Maximum rating
            <input
              className={`${input} mt-1.5`}
              type="number"
              min={800}
              max={3500}
              step={100}
              value={max}
              onChange={(event) => setMax(event.target.value)}
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Topic
            <select
              className={`${input} mt-1.5`}
              value={tag}
              onChange={(event) => setTag(event.target.value)}
            >
              <option value="">All topics</option>
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-muted-foreground">
            Sort
            <select
              className={`${input} mt-1.5`}
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="popular">Most solved</option>
              <option value="rating">Rating ascending</option>
            </select>
          </label>
        </div>
        <label className="mt-5 flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={unsolved}
            onChange={(event) => setUnsolved(event.target.checked)}
            className="accent-primary"
          />
          Unsolved only {complete ? "" : "(based on imported history)"}
        </label>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[530px] text-left text-xs">
            <caption className="sr-only">Codeforces problem ladder</caption>
            <thead className="border-b text-[10px] uppercase text-muted-foreground">
              <tr>
                {["Status", "Problem", "Rating", "Solved by", ""].map(
                  (label, index) => (
                    <th key={index} className="px-2 py-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(page * 50, (page + 1) * 50).map((problem) => (
                <LadderRow
                  key={problem.id}
                  problem={problem}
                  solved={solved.has(problem.id)}
                  complete={complete}
                />
              ))}
            </tbody>
          </table>
          {!filtered.length && !catalog.loading && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No catalog problems match your filters.
            </p>
          )}
        </div>
        <Pagination page={page} total={filtered.length} onChange={setPage} />
      </section>
    </>
  );
}
function LadderRow({
  problem,
  solved,
  complete,
}: {
  problem: Problem;
  solved: boolean;
  complete: boolean;
}) {
  return (
    <tr className="border-b border-border/60 hover:bg-muted/30">
      <td
        className={`px-2 py-4 ${solved ? "text-emerald-400" : "text-muted-foreground"}`}
      >
        {solved ? "✓ Solved" : complete ? "Unsolved" : "Unknown"}
      </td>
      <td className="max-w-80 px-2 py-4">
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary"
        >
          {problem.id.replace("codeforces-", "")}. {problem.title}
        </a>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {problem.tags.join(" · ")}
        </p>
      </td>
      <td className="px-2 font-mono">{problem.rating ?? "—"}</td>
      <td className="px-2 tabular-nums text-muted-foreground">
        {fmt(problem.solvedCount)}
      </td>
      <td className="px-2">
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Solve ${problem.title} on Codeforces`}
        >
          <ExternalLink size={13} />
        </a>
      </td>
    </tr>
  );
}
function RatedHistory({ ratings }: { ratings: CFRating[] }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const rows = ratings.filter(
    (row) =>
      filter === "all" ||
      (filter === "edu" && /educational/i.test(row.name)) ||
      (filter === "div2" && /div\.?\s*2\b/i.test(row.name)) ||
      (filter === "div3" && /div\.?\s*3\b/i.test(row.name)),
  );
  const deltas = rows.flatMap((row) =>
    row.before === null ? [] : [row.rating - row.before],
  );
  const data = rows.map((row, index) => ({
    ...row,
    number: index + 1,
    delta: row.before === null ? null : row.rating - row.before,
  }));
  const maxAbsDelta = Math.max(1, ...deltas.map((value) => Math.abs(value)));
  const maxRating = Math.max(1500, ...rows.map((row) => row.rating));
  const minRating = Math.max(
    0,
    Math.min(1000, ...rows.map((row) => row.rating)) - 100,
  );
  return (
    <>
      <section className={panel}>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Rated history
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">The shape of your climb.</h2>
          <div className="flex gap-1">
            {[
              ["all", "All"],
              ["div2", "Div 2"],
              ["div3", "Div 3"],
              ["edu", "Educational"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={filter === value}
                onClick={() => {
                  setFilter(value);
                  setPage(0);
                }}
                className={`rounded px-3 py-2 text-xs ${filter === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          Filters use actual contest titles. Changes compare official
          pre-contest and post-contest ratings.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-5">
          <Metric label="Rated contests" value={String(rows.length)} />
          <Metric
            label="Latest in selection"
            value={fmt(rows.at(-1)?.rating)}
          />
          <Metric
            label="Peak in selection"
            value={
              rows.length
                ? fmt(Math.max(...rows.map((row) => row.rating)))
                : "—"
            }
          />
          <Metric
            label="Best change"
            value={
              deltas.length
                ? `${Math.max(...deltas) > 0 ? "+" : ""}${Math.max(...deltas)}`
                : "—"
            }
          />
          <Metric
            label="Worst change"
            value={
              deltas.length
                ? `${Math.min(...deltas) > 0 ? "+" : ""}${Math.min(...deltas)}`
                : "—"
            }
          />
        </div>
      </section>
      <section className={panel}>
        <h3 className="mb-5 text-sm font-medium">
          Rating across Codeforces rank bands
        </h3>
        {rows.length ? (
          <>
            <div
              className="h-72 sm:h-96"
              role="img"
              aria-label="Official Codeforces rating history against rank bands"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ left: -15, right: 15, top: 10, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} stroke="#252A36" />
                  <XAxis
                    dataKey="number"
                    tick={{ fill: "#98A2B3", fontSize: 10 }}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    type="number"
                    domain={[
                      minRating,
                      Math.ceil((maxRating + 100) / 100) * 100,
                    ]}
                    tick={{ fill: "#98A2B3", fontSize: 10 }}
                    tickLine={false}
                  />
                  {rankBands
                    .filter(
                      (band) =>
                        band.from < maxRating + 100 && band.to > minRating,
                    )
                    .map((band) => (
                      <ReferenceArea
                        key={band.name}
                        y1={Math.max(minRating, band.from)}
                        y2={Math.min(
                          Math.ceil((maxRating + 100) / 100) * 100,
                          band.to,
                        )}
                        fill={band.color}
                        fillOpacity={0.1}
                        strokeOpacity={0}
                      />
                    ))}
                  <Tooltip
                    content={({ active, payload }) => {
                      const row = payload?.[0]?.payload;
                      return active && row ? (
                        <div
                          style={tooltipStyle}
                          className="max-w-72 space-y-1 p-3"
                        >
                          <p>{row.name}</p>
                          <p className="text-muted-foreground">
                            {new Date(row.date).toLocaleDateString()} · Rank{" "}
                            {fmt(row.rank)}
                          </p>
                          <p>
                            Rating {row.rating}{" "}
                            {row.delta === null
                              ? ""
                              : `(${row.delta >= 0 ? "+" : ""}${row.delta})`}
                          </p>
                        </div>
                      ) : null;
                    }}
                  />
                  <Line
                    dataKey="rating"
                    stroke="#E8EDF5"
                    strokeWidth={2}
                    type="linear"
                    dot={data.length < 30 ? { r: 2, fill: "#E8EDF5" } : false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mb-1 mt-3 text-[11px] text-muted-foreground">
              Per-contest change · same contest order
            </p>
            <div className="relative h-28 overflow-x-auto" role="img" aria-label="Positive and negative rating changes for each contest">
              <div className="absolute inset-x-0 top-1/2 border-t border-border" />
              <div className="relative flex h-full items-stretch gap-1">
                {data.map((row) => (
                  <span key={row.contestId} className="relative min-w-2 max-w-6 flex-1" title={`${row.name}: ${row.delta === null ? "change unavailable" : `${row.delta >= 0 ? "+" : ""}${row.delta} rating`}`}>
                    {row.delta !== null && <span className={`absolute inset-x-0 rounded-sm ${row.delta >= 0 ? "bg-emerald-400/80" : "bg-rose-400/80"}`} style={{ height: `${Math.max(2, Math.abs(row.delta) / maxAbsDelta * 48)}%`, ...(row.delta >= 0 ? { bottom: "50%" } : { top: "50%" }) }} />}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
              {rankBands
                .filter(
                  (band) => band.from < maxRating + 100 && band.to > minRating,
                )
                .map((band) => (
                  <span key={band.name}>
                    <span
                      className="mr-1.5 inline-block size-2 rounded-sm"
                      style={{ background: band.color }}
                    />
                    {band.name}
                  </span>
                ))}
            </div>
          </>
        ) : (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No rated contests match this period and contest filter.
          </p>
        )}
      </section>
      <section className={panel}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[570px] text-left text-xs">
            <caption className="sr-only">Rated contest results</caption>
            <thead className="border-b text-[10px] uppercase text-muted-foreground">
              <tr>
                {["Contest", "Date", "Rank", "Rating", "Change"].map(
                  (label) => (
                    <th key={label} className="px-2 py-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[...rows]
                .reverse()
                .slice(page * 50, (page + 1) * 50)
                .map((row) => (
                  <tr key={row.contestId} className="border-b border-border/60">
                    <td className="px-2 py-4">
                      <a
                        href={`https://codeforces.com/contest/${row.contestId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        {row.name}
                      </a>
                    </td>
                    <td className="px-2 text-muted-foreground">
                      {row.date.slice(0, 10)}
                    </td>
                    <td className="px-2 tabular-nums">{fmt(row.rank)}</td>
                    <td className="px-2 font-mono">{row.rating}</td>
                    <td
                      className={`px-2 font-mono ${row.before !== null && row.rating >= row.before ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {row.before === null
                        ? "—"
                        : `${row.rating >= row.before ? "+" : ""}${row.rating - row.before}`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={rows.length} onChange={setPage} />
      </section>
    </>
  );
}
interface ContestData {
  contest: { id: number; name: string; duration: number; start: number };
  problems: Array<{
    index: string;
    title: string;
    rating: number | null;
    tags: string[];
  }>;
  row: {
    rank: number;
    points: number;
    penalty: number;
    problemResults: Array<{
      points: number;
      rejectedAttemptCount: number;
      bestSubmissionTimeSeconds?: number;
    }>;
  } | null;
}
function ContestTimeline({
  ratings,
  submissions,
  userId,
}: {
  ratings: CFRating[];
  submissions: CFSubmission[];
  userId: string | undefined;
}) {
  const [selected, setSelected] = useState("");
  const contestId = ratings.some((row) => row.contestId === selected)
    ? selected
    : (ratings.at(-1)?.contestId ?? "");
  const query = useQuery({
    queryKey: ["contest-analysis", userId, contestId],
    queryFn: () =>
      jsonRequest<ContestData>(`/api/statistics/contest?id=${contestId}`),
    enabled: Boolean(contestId),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const data = query.data;
  const rows = submissions
    .filter(
      (row) =>
        String(row.contestId) === contestId &&
        row.participantType === "CONTESTANT" &&
        row.relativeSeconds !== null &&
        row.relativeSeconds >= 0 &&
        (!data || row.relativeSeconds <= data.contest.duration),
    )
    .sort((a, b) => (a.relativeSeconds ?? 0) - (b.relativeSeconds ?? 0));
  const accepted = new Set(
    rows.filter((row) => row.verdict === "OK").map((row) => row.problemId),
  );
  const firstAC = rows.find((row) => row.verdict === "OK");
  return (
    <>
      <section className={panel}>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Contest post-mortem
        </p>
        <h2 className="mt-2 text-xl font-semibold">
          See where the round went.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Official standings and your in-contest submission timeline. Practice
          and virtual attempts are excluded.
        </p>
        <label className="mt-6 block max-w-xl text-xs text-muted-foreground">
          Rated contest
          <select
            value={contestId}
            onChange={(event) => setSelected(event.target.value)}
            className={`${input} mt-2`}
          >
            <option value="" disabled>
              Select a contest
            </option>
            {[...ratings].reverse().map((row) => (
              <option key={row.contestId} value={row.contestId}>
                {row.name} · {row.date.slice(0, 10)}
              </option>
            ))}
          </select>
        </label>
      </section>
      {!contestId ? (
        <p className={`${panel} text-sm text-muted-foreground`}>
          Your synchronized rated contests will appear here.
        </p>
      ) : query.isLoading ? (
        <div
          className={`${panel} h-64 animate-pulse`}
          role="status"
          aria-label="Loading official contest standings"
        />
      ) : query.error ? (
        <div className={panel} role="alert">
          <p className="text-sm">{query.error.message}</p>
          <button
            onClick={() => void query.refetch()}
            className="mt-4 text-xs text-primary"
          >
            Retry standings
          </button>
        </div>
      ) : data ? (
        <>
          <section className={panel}>
            <h3 className="text-sm font-medium">{data.contest.name}</h3>
            <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
              <Metric label="Official rank" value={fmt(data.row?.rank)} />
              <Metric label="Official points" value={fmt(data.row?.points)} />
              <Metric
                label="Problems accepted in contest"
                value={String(accepted.size)}
              />
              <Metric
                label="Time to first AC"
                value={
                  firstAC
                    ? fmt((firstAC.relativeSeconds ?? 0) / 60, " min")
                    : "—"
                }
              />
            </div>
            {!data.row && (
              <p className="mt-4 text-xs text-muted-foreground">
                No public standings row was returned for this handle.
              </p>
            )}
            <div className="mt-7 space-y-5">
              {data.problems.map((problem, index) => {
                const attempts = rows.filter(
                  (row) => row.index === problem.index,
                );
                const result = data.row?.problemResults[index];
                return (
                  <div key={problem.index}>
                    <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
                      <a
                        href={`https://codeforces.com/contest/${data.contest.id}/problem/${problem.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        {problem.index}. {problem.title}
                        <span className="ml-2 text-muted-foreground">
                          {problem.rating ?? "Unrated"}
                        </span>
                      </a>
                      <span className="text-muted-foreground">
                        {result
                          ? `${result.points} pts · ${result.rejectedAttemptCount} rejected`
                          : "Standings unavailable"}
                      </span>
                    </div>
                    <div
                      className="relative h-9 rounded border bg-background"
                      role="group"
                      aria-label={`Submission timeline for ${problem.title}`}
                    >
                      {attempts.map((row) => (
                        <a
                          key={row.id}
                          href={`https://codeforces.com/contest/${data.contest.id}/submission/${row.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            left: `calc(${Math.min(99, Math.max(1, ((row.relativeSeconds ?? 0) / data.contest.duration) * 100))}% - 4px)`,
                          }}
                          className={`absolute top-2.5 size-3 rounded-full border border-background focus-visible:ring-2 focus-visible:ring-ring ${row.verdict === "OK" ? "bg-emerald-400" : "bg-rose-400"}`}
                          title={`${verdictLabels[row.verdict] ?? row.verdict} at ${((row.relativeSeconds ?? 0) / 60).toFixed(1)} min`}
                          aria-label={`${verdictLabels[row.verdict] ?? row.verdict} at ${((row.relativeSeconds ?? 0) / 60).toFixed(1)} minutes`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
              <span>0 min</span>
              <span>{data.contest.duration / 60} min · contest end</span>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              <span className="text-emerald-400">● Accepted</span>
              <span className="ml-4 text-rose-400">
                ● Unsuccessful attempt
              </span>{" "}
              · Hover or focus a marker for timing.
            </p>
          </section>
          <section className={panel}>
            <h3 className="mb-5 text-sm font-medium">Attempt sequence</h3>
            {rows.length ? (
              <ol className="divide-y">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-xs"
                  >
                    <span className="w-20 font-mono text-muted-foreground">
                      {((row.relativeSeconds ?? 0) / 60).toFixed(1)} min
                    </span>
                    <Outcome verdict={row.verdict} />
                    <a
                      href={`https://codeforces.com/contest/${row.contestId}/submission/${row.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {row.index}. {row.title}
                    </a>
                    <span className="ml-auto text-muted-foreground">
                      {row.language ?? "Language unavailable"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                No in-contest attempts are present in the imported submission
                archive for this round.
              </p>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
