"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  RefreshCw,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProblemRows } from "@/components/problem/ProblemRows";
import { useCodeforcesCatalog as useCatalog } from "@/hooks/use-codeforces-catalog";
import { useTracker } from "@/hooks/use-tracker";
import { useAuth } from "@/contexts/AuthContext";
import { ChakraMark } from "@/components/brand/ChakraMark";
import {
  TRAINING_TRACKS,
  trackProblems,
  chakraFor,
} from "@/lib/training";
import { ThemeRounds } from "./ThemeRounds";
const LEVEL_NAMES = ["Foundations", "Core Algorithms", "Intermediate Problem Solving", "Advanced Algorithms", "Expert Competitive Programming"] as const;
export default function TrainingGym({
  selectedTrackId,
  onOpenHandleModal,
}: { selectedTrackId?: string; onOpenHandleModal?: () => void } = {}) {
  const { user } = useAuth();
  const catalog = useCatalog();
  const tracker = useTracker(0);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [trainingView, setTrainingView] = useState<"rounds" | "tracks">(selectedTrackId ? "tracks" : "rounds");
  const track = TRAINING_TRACKS.find((item) => item.id === selectedTrackId);
  const solved = new Set(tracker.data?.solvedIds ?? []);
  const problems = track ? trackProblems(catalog.problems, track.id) : [];
  const sync = async () => {
    setRequesting(true);
    setError("");
    try {
      await tracker.sync("codeforces");
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your sync could not be queued.",
      );
      return false;
    } finally {
      setRequesting(false);
    }
  };
  return (
    <Layout onOpenHandleModal={onOpenHandleModal}>
      <div className="space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {track && (
              <Link
                href="/training"
                className="mb-3 inline-block text-xs text-muted-foreground hover:text-foreground"
              >
                ← All training tracks
              </Link>
            )}
            <p className="mb-2 text-xs uppercase tracking-[.12em] text-muted-foreground">
              Deliberate practice
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {track?.title ?? "Training Gym"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {track?.description ??
                "Choose a focus. Solve at the source. Track verified progress."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><Link href="/resources" className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors hover:bg-muted">Learning resources <ArrowRight size={14} /></Link><Link href="/upsolve" className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors hover:bg-muted">Upsolve attempted problems <ArrowRight size={14} /></Link><Button
            variant="outline"
            className="bg-transparent"
            onClick={() => void sync()}
            disabled={
              requesting ||
              tracker.isSyncing ||
              !tracker.data?.accounts.some(
                (item) => item.platform === "codeforces",
              )
            }
          >
            <RefreshCw
              size={15}
              className={requesting || tracker.isSyncing ? "animate-spin" : ""}
            />
            {requesting || tracker.isSyncing
              ? "Synchronizing…"
              : "Check for solves"}
          </Button></div>
        </header>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-500/20 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
        {!track && trainingView === "tracks" && <section className="relative overflow-hidden rounded-xl border border-violet-400/20 bg-[#171920] p-6 sm:p-8">
          <div className="absolute right-0 top-0 hidden h-full w-1/3 border-l border-white/5 bg-[radial-gradient(circle_at_60%_30%,rgba(169,147,240,.16),transparent_55%)] md:block" aria-hidden="true" />
          <div className="relative max-w-xl"><p className="text-[11px] font-medium uppercase tracking-[.18em] text-violet-300">Learning, on your terms</p><h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">Meet Symm AI</h2><p className="mt-3 text-sm leading-6 text-slate-400">Choose a topic. Get a structured roadmap, focused lessons, and questions that make you think.</p><Link href="/training/symm" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-300 px-4 py-2.5 text-sm font-medium text-[#12131a] transition-colors hover:bg-violet-200">Build a learning path <ArrowRight size={16}/></Link></div>
        </section>}
        {tracker.isError && (
          <p role="alert" className="text-sm text-amber-300">
            {tracker.error.message}{" "}
            <button
              onClick={() => void tracker.refetch()}
              className="underline"
            >
              Retry
            </button>
          </p>
        )}
        {!tracker.isLoading &&
          !tracker.data?.accounts.some(
            (item) => item.platform === "codeforces",
          ) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Verify a Codeforces account to track solves and earn eligible
                Coins.
              </p>
              <Link href="/onboarding?step=3" className="text-sm text-primary">
                Connect account <ArrowRight className="inline size-3.5" />
              </Link>
            </div>
          )}
        <nav aria-label="Training views" className="flex items-center gap-6 border-b text-sm">
          {([['rounds','Themed rounds'],['tracks','Topic tracks']] as const).map(([value,label])=><button key={value} type="button" onClick={()=>setTrainingView(value)} aria-current={trainingView===value?'page':undefined} className={`border-b-2 px-1 pb-3 transition-colors ${trainingView===value?'border-primary text-foreground':'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
          <Link href="/sheets" className="pb-3 text-muted-foreground hover:text-foreground">Practice sheets</Link>
        </nav>
        {trainingView === "rounds" ? <ThemeRounds key={user?.id??'anonymous'} userId={user?.id??'anonymous'} problems={catalog.problems} solves={tracker.data?.solves??[]} solvedIds={tracker.data?.solvedIds??[]} ready={Boolean(tracker.data?.historyComplete && tracker.data.accounts.some(a=>a.platform==='codeforces'))} syncing={tracker.isSyncing||requesting} syncFailed={tracker.data?.jobs.find(j=>j.provider==='codeforces')?.status==='failed'||false} onSync={sync} coins={tracker.data?.overview.chakra??null} rating={tracker.data?.snapshots.find(s=>s.provider==='codeforces')?.summary.rating??null} catalogError={catalog.error} onReloadCatalog={catalog.reload}/> : <>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [
              "Total solves",
              tracker.data?.overview.totalSolves?.toLocaleString() ?? "—",
              "Codeforces history + LeetCode profile",
            ],
            [
              "Coins earned",
              tracker.data
                ? tracker.data.overview.chakra.toLocaleString()
                : "—",
              "Authoritative ledger balance",
            ],
            [
              "Tracks",
              String(TRAINING_TRACKS.length),
              "Organized by topic and difficulty",
            ],
            [
              "Verification",
              tracker.isSyncing
                ? "Pending"
                : tracker.data?.historyComplete
                  ? "Up to date"
                  : "Not ready",
              tracker.data?.historyComplete
                ? "Source evidence imported"
                : "Connect an account or finish initial sync",
            ],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-lg border bg-card p-4 sm:p-5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-3 text-xl font-semibold tabular-nums">{value}</p>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                {detail}
              </p>
            </div>
          ))}
        </section>
        {catalog.error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4 text-sm text-amber-300"
          >
            {catalog.error}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void catalog.reload()}
            >
              Retry catalog
            </Button>
          </div>
        )}
        {catalog.loading ? (
          <div
            role="status"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-lg border bg-card"
              />
            ))}
            <span className="sr-only">Loading training tracks</span>
          </div>
        ) : track ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-medium">
                Track problems{" "}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {problems.length} in this catalog
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {tracker.data?.historyComplete
                  ? `${problems.filter((problem) => solved.has(problem.id)).length} completed`
                  : "Completion appears after full synchronization"}
              </p>
            </div>
            {problems.length ? (
              <ProblemRows
                problems={problems}
                solvedIds={tracker.data?.solvedIds}
                historyComplete={tracker.data?.historyComplete}
                tracking={Boolean(tracker.data?.accounts.length)}
              />
            ) : (
              <p className="rounded-md border p-6 text-sm text-muted-foreground">
                No provider problems are available for this track right now.
              </p>
            )}
          </section>
        ) : (
          <section aria-label="Training levels" className="space-y-8">
            {LEVEL_NAMES.map((levelName, levelIndex) => <div key={levelName}>
              <div className="mb-3 flex items-baseline gap-3"><span className="text-xs font-semibold text-primary">LEVEL {String(levelIndex + 1).padStart(2, "0")}</span><h2 className="text-lg font-semibold tracking-tight">{levelName}</h2></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRAINING_TRACKS.filter((item) => item.level === levelIndex + 1).map((item) => {
              const rows = trackProblems(catalog.problems, item.id);
              const done = rows.filter((problem) =>
                solved.has(problem.id),
              ).length;
              const progress = rows.length
                ? Math.round((done / rows.length) * 100)
                : 0;
              const potential = rows
                .filter((problem) => !solved.has(problem.id))
                .reduce(
                  (sum, problem) =>
                    sum + (chakraFor("codeforces", problem.rating) ?? 0),
                  0,
                );
              return (
                <article
                  key={item.id}
                  className="flex flex-col rounded-lg border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">{item.title}</h2>
                    {rows.length && done === rows.length ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : null}
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-4 text-[11px] text-muted-foreground">
                    {rows.length} problems · CF {item.min}–{item.max}
                  </p>
                  <div
                    className="mt-4 h-1 overflow-hidden rounded bg-muted"
                    role="progressbar"
                    aria-label={`${item.title} completion`}
                    aria-valuenow={
                      tracker.data?.historyComplete ? progress : undefined
                    }
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${tracker.data?.historyComplete ? progress : 0}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {tracker.data?.historyComplete
                        ? `${done}/${rows.length} completed · ${progress}%`
                        : "Verification pending"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      <ChakraMark className="size-3" variant="small" />
                      {potential.toLocaleString()} potential
                    </span>
                  </div>
                  <Link
                    href={`/train/${item.id}`}
                    className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    {done ? "Resume track" : "Open track"}
                    <ArrowRight size={13} />
                  </Link>
                </article>
              );
            })}
              </div>
            </div>)}
          </section>
        )}
        </>}
        <p className="text-xs leading-6 text-muted-foreground">
          Each eligible Codeforces problem can earn coins once after account
          synchronization, including problems solved before you joined.
          Unrated problems, ratings outside 800–3500, and
          LeetCode solves do not currently earn rewards.
        </p>
      </div>
    </Layout>
  );
}
