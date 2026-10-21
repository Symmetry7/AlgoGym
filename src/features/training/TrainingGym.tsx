"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProblemRows } from "@/components/problem/ProblemRows";
import { useCodeforcesCatalog as useCatalog } from "@/hooks/use-codeforces-catalog";
import { useTracker } from "@/hooks/use-tracker";
import usePersistentState from "@/hooks/usePersistentState";
import { useAuth } from "@/contexts/AuthContext";
import { ChakraMark } from "@/components/brand/ChakraMark";
import {
  TRAINING_TRACKS,
  trackProblems,
  chakraFor,
  secondsRemaining,
} from "@/lib/training";
import type { Problem } from "@/lib/types";
import { ThemeRounds } from "./ThemeRounds";
type Session = {
  problemIds: string[];
  trackId: string;
  deadline: number | null;
  pausedSeconds: number;
};
const EMPTY_SESSION: Session = {
  problemIds: [],
  trackId: "fundamentals",
  deadline: null,
  pausedSeconds: 7200,
};
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
  const [now, setNow] = useState(Date.now());
  const [minutes, setMinutes] = useState(120);
  const [trainingView, setTrainingView] = useState<"rounds" | "tracks">(selectedTrackId ? "tracks" : "rounds");
  const key = `algogym:training-session:${user?.id ?? "anonymous"}`;
  const [session, setSession] = usePersistentState<Session>(key, EMPTY_SESSION);
  const beforeSync = useRef<{
    solves: Set<string>;
    ledger: Set<string>;
  } | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!user || localStorage.getItem(key)) return;
    try {
      const old = JSON.parse(localStorage.getItem("trainingProblems") ?? "[]");
      if (Array.isArray(old) && old.length)
        setSession({
          ...EMPTY_SESSION,
          problemIds: old
            .filter((problem) => typeof problem?.id === "string")
            .map((problem) => problem.id),
          pausedSeconds: Math.max(
            0,
            Math.min(
              14_400,
              Number(localStorage.getItem("trainingTimeRemaining")) || 7200,
            ),
          ),
        });
    } catch {
      /* Invalid legacy practice notes cannot affect verified progress. */
    }
  }, [user?.id, key]);
  useEffect(() => {
    if (!beforeSync.current || !tracker.data || tracker.isSyncing || requesting)
      return;
    const added = tracker.data.ledger.filter(
      (entry) => entry.delta > 0 && !beforeSync.current!.ledger.has(entry.id),
    );
    const solved = tracker.data.solvedIds.filter(
      (id) => !beforeSync.current!.solves.has(id),
    );
    if (added.length)
      toast.success("Problem Solved", {
        description: `+${added.reduce((sum, entry) => sum + entry.delta, 0)} coins added to your balance`,
      });
    else if (solved.length)
      toast.success(
        `${solved.length} accepted solve${solved.length === 1 ? "" : "s"} synchronized`,
        {
          description:
            "Eligible past and new accepted problems can earn coins once.",
        },
      );
    beforeSync.current = null;
  }, [tracker.data, tracker.isSyncing, requesting]);
  const track = TRAINING_TRACKS.find((item) => item.id === selectedTrackId);
  const solved = new Set(tracker.data?.solvedIds ?? []);
  const problems = track ? trackProblems(catalog.problems, track.id) : [];
  const saved = session.problemIds
    .map((id) => catalog.problems.find((problem) => problem.id === id))
    .filter(Boolean) as Problem[];
  const remaining = secondsRemaining(
    session.deadline,
    session.pausedSeconds,
    now,
  );
  const timerText = `${Math.floor(remaining / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((remaining % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
  const sync = async () => {
    setRequesting(true);
    setError("");
    beforeSync.current = {
      solves: new Set(tracker.data?.solvedIds ?? []),
      ledger: new Set(tracker.data?.ledger.map((entry) => entry.id) ?? []),
    };
    try {
      await tracker.sync("codeforces");
    } catch (reason) {
      beforeSync.current = null;
      setError(
        reason instanceof Error
          ? reason.message
          : "Your sync could not be queued.",
      );
    } finally {
      setRequesting(false);
    }
  };
  const start = () => {
    setError("");
    const options = (
      track ? problems : trackProblems(catalog.problems, "fundamentals")
    ).filter((problem) => !solved.has(problem.id));
    const chosen: Problem[] = [];
    const pool = [...options];
    while (pool.length && chosen.length < 4)
      chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    if (!chosen.length) {
      setError(
        "No uncompleted problems are available in this track. Choose another track or refresh the catalog.",
      );
      return;
    }
    const duration = Math.max(5, Math.min(240, Number(minutes) || 120)) * 60;
    setSession({
      trackId: track?.id ?? "fundamentals",
      problemIds: chosen.map((problem) => problem.id),
      deadline: Date.now() + duration * 1000,
      pausedSeconds: duration,
    });
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
        {!track && <section className="relative overflow-hidden rounded-xl border border-violet-400/20 bg-[#171920] p-6 sm:p-8">
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
        {trainingView === "rounds" ? <ThemeRounds userId={user?.id??'anonymous'} problems={catalog.problems} solves={tracker.data?.solves??[]} solvedIds={tracker.data?.solvedIds??[]} ready={Boolean(tracker.data?.historyComplete && tracker.data.accounts.some(a=>a.platform==='codeforces'))} syncing={tracker.isSyncing||requesting} onSync={()=>void sync()}/> : <>
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
        <section className="rounded-lg border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-medium">
                {saved.length
                  ? "Your practice session"
                  : "Focused practice session"}
              </h2>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                A personal timer and saved problem list. Solves and Coins are
                verified independently.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label
                htmlFor="training-minutes"
                className="text-xs text-muted-foreground"
              >
                Minutes
              </label>
              <input
                id="training-minutes"
                type="number"
                min={5}
                max={240}
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
                className="h-9 w-20 rounded border bg-background px-2 text-sm"
              />
              <Button
                size="sm"
                onClick={start}
                disabled={catalog.loading || !catalog.problems.length}
              >
                {saved.length ? "New session" : "Start session"}
              </Button>
            </div>
          </div>
          {saved.length > 0 && (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-y py-4">
                <p className="flex items-center gap-2 font-mono text-2xl tabular-nums">
                  <Clock size={17} className="text-muted-foreground" />
                  {timerText}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={remaining === 0}
                  onClick={() =>
                    setSession((old) =>
                      old.deadline
                        ? {
                            ...old,
                            deadline: null,
                            pausedSeconds: secondsRemaining(
                              old.deadline,
                              old.pausedSeconds,
                            ),
                          }
                        : {
                            ...old,
                            deadline: Date.now() + old.pausedSeconds * 1000,
                          },
                    )
                  }
                >
                  {session.deadline ? <Pause size={14} /> : <Play size={14} />}{" "}
                  {session.deadline ? "Pause" : "Resume"}
                </Button>
              </div>
              {remaining === 0 && (
                <p role="status" className="text-sm text-muted-foreground">
                  Your practice timer is complete. You can keep solving or start
                  a new session.
                </p>
              )}
              <ProblemRows
                problems={saved}
                solvedIds={tracker.data?.solvedIds}
                historyComplete={tracker.data?.historyComplete}
                tracking={Boolean(tracker.data?.accounts.length)}
              />
            </div>
          )}
        </section>
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
