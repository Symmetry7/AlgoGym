"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProblemRows } from "@/components/problem/ProblemRows";
import { TrackerFeedback } from "@/components/analytics/TrackerFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/hooks/use-catalog";
import { useTracker } from "@/hooks/use-tracker";
import { chakraFor } from "@/lib/training";
export default function Index() {
  const { user } = useAuth();
  const catalog = useCatalog();
  const tracker = useTracker(0, "all", false);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") ?? "");
    if (["leetcode", "codeforces"].includes(params.get("platform") ?? ""))
      setPlatform(params.get("platform")!);
  }, []);
  const solved = new Set(tracker.data?.solvedIds ?? []);
  const topics = [
    ...new Set(
      catalog.problems
        .filter(
          (problem) => platform === "all" || problem.platform === platform,
        )
        .flatMap((problem) => problem.tags),
    ),
  ].sort();
  const problems = useMemo(
    () =>
      catalog.problems
        .filter(
          (problem) =>
            (platform === "all" || problem.platform === platform) &&
            (!search ||
              `${problem.title} ${problem.id} ${problem.tags.join(" ")}`
                .toLowerCase()
                .includes(search.toLowerCase())) &&
            (difficulty === "all" || problem.difficulty === difficulty) &&
            (!min ||
              (problem.rating !== undefined &&
                problem.rating >= Number(min))) &&
            (!max ||
              (problem.rating !== undefined &&
                problem.rating <= Number(max))) &&
            (!tag || problem.tags.includes(tag)) &&
            (status === "all" ||
              (status === "solved" && solved.has(problem.id)) ||
              (status === "unsolved" &&
                problem.platform === "codeforces" &&
                tracker.data?.historyComplete &&
                !solved.has(problem.id))) &&
            !(
              sort === "chakra" &&
              (problem.platform !== "codeforces" ||
                chakraFor("codeforces", problem.rating) === null)
            ),
        )
        .sort((a, b) =>
          sort === "title"
            ? a.title.localeCompare(b.title)
            : sort === "difficulty"
              ? (a.rating ??
                  { Easy: 1, Medium: 2, Hard: 3 }[String(a.difficulty)] ??
                  Infinity) -
                (b.rating ??
                  { Easy: 1, Medium: 2, Hard: 3 }[String(b.difficulty)] ??
                  Infinity)
              : sort === "chakra"
                ? (chakraFor(b.platform, b.rating) ?? 0) -
                  (chakraFor(a.platform, a.rating) ?? 0)
                : (b.solvedCount ?? 0) - (a.solvedCount ?? 0),
        ),
    [
      catalog.problems,
      search,
      platform,
      difficulty,
      min,
      max,
      tag,
      status,
      sort,
      tracker.data,
    ],
  );
  useEffect(
    () => setPage(0),
    [search, platform, difficulty, min, max, tag, status, sort],
  );
  const clear = () => {
    setSearch("");
    setPlatform("all");
    setDifficulty("all");
    setMin("");
    setMax("");
    setTag("");
    setStatus("all");
    setSort("popular");
  };
  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              One good problem at a time
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Explore Problems
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Find your next challenge across public coding-platform catalogs.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={catalog.reload}
            disabled={catalog.loading}
          >
            Refresh catalog
          </Button>
        </header>
        {user && <TrackerFeedback tracker={tracker} />}
        {catalog.warnings?.map((warning) => (
          <p
            key={warning}
            role="status"
            className="rounded-md border border-amber-400/20 p-3 text-xs text-amber-300"
          >
            {warning}
          </p>
        ))}
        {catalog.error && (
          <p role="alert" className="text-sm text-rose-300">
            {catalog.error}
          </p>
        )}
        <section
          aria-label="Problem filters"
          className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
        >
          <div className="flex flex-wrap gap-3">
            <label className="relative min-w-56 flex-1">
              <span className="sr-only">Search problems and topics</span>
              <Search
                size={15}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <Input
                placeholder="Search by title, ID or topic"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </label>
            <label>
              <span className="sr-only">Platform</span>
              <select
                className="h-10 rounded-md border bg-background px-3 text-xs"
                value={platform}
                onChange={(event) => {
                  setPlatform(event.target.value);
                  setDifficulty("all");
                  setTag("");
                }}
              >
                <option value="all">All platforms</option>
                <option value="codeforces">Codeforces</option>
                <option value="leetcode">LeetCode</option>
              </select>
            </label>
            <Button variant="ghost" size="sm" className="h-10" onClick={clear}>
              Reset filters
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {platform !== "codeforces" && (
              <label className="text-[11px] text-muted-foreground">
                LeetCode difficulty
                <select
                  value={difficulty}
                  onChange={(event) => {
                    setDifficulty(event.target.value);
                    if (event.target.value !== "all") setPlatform("leetcode");
                  }}
                  className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-xs"
                >
                  <option value="all">Any difficulty</option>
                  {["Easy", "Medium", "Hard"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-[11px] text-muted-foreground">
              CF minimum rating
              <Input
                type="number"
                min={800}
                max={3500}
                step={100}
                value={min}
                onChange={(event) => setMin(event.target.value)}
                placeholder="Any"
                className="mt-2 h-9 text-xs"
              />
            </label>
            <label className="text-[11px] text-muted-foreground">
              CF maximum rating
              <Input
                type="number"
                min={800}
                max={3500}
                step={100}
                value={max}
                onChange={(event) => setMax(event.target.value)}
                placeholder="Any"
                className="mt-2 h-9 text-xs"
              />
            </label>
            <label className="text-[11px] text-muted-foreground">
              Topic
              <select
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-xs"
              >
                <option value="">All topics</option>
                {topics.map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-muted-foreground">
              Verified solve status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-xs"
              >
                <option value="all">All problems</option>
                <option value="solved" disabled={!user}>
                  Verified solved
                </option>
                <option
                  value="unsolved"
                  disabled={!tracker.data?.historyComplete}
                >
                  Codeforces unsolved
                </option>
              </select>
            </label>
            <label className="text-[11px] text-muted-foreground">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-xs"
              >
                <option value="popular">Most solved · CF</option>
                <option value="title">Title A–Z</option>
                <option value="difficulty">Difficulty ascending</option>
                <option value="chakra">Potential Chakra · CF</option>
              </select>
            </label>
          </div>
          {min && max && Number(min) > Number(max) && (
            <p role="alert" className="text-xs text-amber-400">
              Minimum rating must not exceed maximum rating.
            </p>
          )}
        </section>
        {catalog.loading ? (
          <div
            role="status"
            aria-label="Loading public problem catalogs"
            className="space-y-2"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded border bg-card"
              />
            ))}
          </div>
        ) : problems.length ? (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>{problems.length.toLocaleString()} matching problems</p>
              <span>
                {catalog.problems.length.toLocaleString()} catalog entries
                loaded
              </span>
            </div>
            <ProblemRows
              problems={problems.slice(page * 50, (page + 1) * 50)}
              solvedIds={tracker.data?.solvedIds}
              historyComplete={tracker.data?.historyComplete}
              tracking={Boolean(
                user &&
                  tracker.data?.accounts.some(
                    (profile) => profile.platform === "codeforces",
                  ),
              )}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>
                Page {page + 1} of{" "}
                {Math.max(1, Math.ceil(problems.length / 50))}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={13} />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(page + 1) * 50 >= problems.length}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No problems match the current selection.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={clear}
            >
              Clear filters
            </Button>
          </div>
        )}
        <p className="text-[11px] leading-6 text-muted-foreground">
          Solve opens the source platform. Potential Chakra requires a first
          eligible accepted solve on a verified linked account; opening a
          problem or marking personal study complete never awards points.
          LeetCode per-problem proof and rewards are unavailable.
        </p>
      </div>
    </Layout>
  );
}
