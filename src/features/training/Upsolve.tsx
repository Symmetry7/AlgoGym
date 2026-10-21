"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

type QueueItem = {
  problem: { id: string; title: string; url: string; cf_rating: number | null; tags: string[] | null };
  attempts: number;
  lastAttemptedAt: string;
  lastVerdict: string;
  contestId: number | null;
};
type Queue = { problems: QueueItem[]; scannedSubmissions: number; historyComplete: boolean; lastSyncedAt: string | null };

export default function Upsolve() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("all");
  const [rating, setRating] = useState("all");
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/upsolve", { credentials: "include", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your upsolve queue.");
      setQueue(data as Queue);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load your upsolve queue.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const topics = useMemo(() => [...new Set((queue?.problems ?? []).flatMap((item) => item.problem.tags ?? []))].sort(), [queue]);
  const visible = useMemo(() => (queue?.problems ?? []).filter((item) => {
    const matchesTopic = topic === "all" || item.problem.tags?.includes(topic);
    const matchesRating = rating === "all" || (item.problem.cf_rating !== null && Math.floor(item.problem.cf_rating / 400) * 400 === Number(rating));
    return matchesTopic && matchesRating && item.problem.title.toLowerCase().includes(search.toLowerCase().trim());
  }), [queue, topic, rating, search]);

  return <Layout><div className="mx-auto max-w-6xl space-y-7 py-3">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-medium uppercase tracking-[.16em] text-muted-foreground">Training Gym / Upsolve</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Return to what challenged you.</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Recent Codeforces problems you attempted but have not yet solved.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh queue</button>
    </header>
    {queue && <p className="text-xs text-muted-foreground">{queue.problems.length} open problems from the latest {queue.scannedSubmissions.toLocaleString()} unsuccessful submissions{queue.lastSyncedAt ? ` · Last synced ${new Date(queue.lastSyncedAt).toLocaleDateString()}` : ""}. {queue.historyComplete ? "Provider archive synchronized." : "The initial provider sync may still be running."}</p>}
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_180px_150px]">
      <label className="grid gap-1 text-xs text-muted-foreground">Find a problem<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title" className="h-10 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
      <label className="grid gap-1 text-xs text-muted-foreground">Topic<select value={topic} onChange={(event) => setTopic(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"><option value="all">All topics</option>{topics.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="grid gap-1 text-xs text-muted-foreground">Rating<select value={rating} onChange={(event) => setRating(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"><option value="all">All ratings</option>{[800,1200,1600,2000,2400,2800,3200].map((value) => <option key={value} value={value}>{value}–{value + 399}</option>)}</select></label>
    </div>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 p-5 text-sm"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-2 text-primary underline">Retry</button></div>}
    {loading && <p role="status" className="py-10 text-center text-sm text-muted-foreground">Loading your recent attempts…</p>}
    {!loading && !error && !queue?.problems.length && <div className="rounded-xl border bg-card p-8 text-center"><h2 className="font-medium">No pending upsolves found</h2><p className="mt-2 text-sm text-muted-foreground">Attempted Codeforces problems appear here after your account synchronizes. Completed problems leave the queue.</p><Link href="/training" className="mt-5 inline-flex items-center gap-1 text-sm text-primary">Explore training <ArrowRight size={15} /></Link></div>}
    {!loading && !error && Boolean(queue?.problems.length) && <div className="overflow-hidden rounded-xl border bg-card"><div className="border-b px-5 py-3 text-xs text-muted-foreground">Showing {visible.length} of {queue?.problems.length} recent problems</div>{visible.length ? <ul className="divide-y">{visible.map((item) => <li key={item.problem.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><h2 className="truncate text-sm font-medium">{item.problem.title}</h2><p className="mt-1 text-xs text-muted-foreground">CF {item.problem.cf_rating ?? "unrated"} · {item.attempts} recent attempt{item.attempts === 1 ? "" : "s"} · {new Date(item.lastAttemptedAt).toLocaleDateString()}</p><div className="mt-2 flex flex-wrap gap-1">{item.problem.tags?.slice(0, 4).map((tag) => <span key={tag} className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">{tag}</span>)}</div></div><div className="flex shrink-0 items-center gap-3"><Link href={`/training/symm?topic=${encodeURIComponent(`Teach me the ${item.problem.tags?.[0] ?? "algorithmic"} concepts needed to solve ${item.problem.title}, without revealing the answer.`)}`} className="text-xs font-medium text-primary hover:underline">Learn with Symm AI</Link><a href={item.problem.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted">Open problem <ExternalLink size={13} /></a></div></li>)}</ul> : <p className="p-8 text-center text-sm text-muted-foreground">No problems match these filters.</p>}</div>}
  </div></Layout>;
}
