"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { TRAINING_RESOURCES } from "@/lib/training-resources";

export default function LearningResources() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const visible = useMemo(() => TRAINING_RESOURCES.filter((item) =>
    (level === "All levels" || item.difficulty === level) &&
    `${item.title} ${item.objective}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [query, level]);
  return <Layout><div className="mx-auto max-w-6xl space-y-7 py-3">
    <header><p className="text-xs font-medium uppercase tracking-[.16em] text-muted-foreground">Training Gym / Resources</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Build the concept. Then solve.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A small, attributed collection of competitive programming guides. Open the source or turn a topic into your own Symm AI path.</p></header>
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_180px]"><label className="grid gap-1 text-xs text-muted-foreground">Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a concept" className="h-10 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label><label className="grid gap-1 text-xs text-muted-foreground">Difficulty<select value={level} onChange={(event) => setLevel(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring">{["All levels", "Foundations", "Core", "Intermediate", "Advanced"].map((value) => <option key={value}>{value}</option>)}</select></label></div>
    <div className="grid gap-3 md:grid-cols-2">{visible.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{item.difficulty}</span><span>{item.minutes} min guide</span></div><h2 className="mt-5 text-lg font-semibold tracking-tight">{item.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.objective}</p><p className="mt-4 text-xs text-muted-foreground">Prerequisite: {item.prerequisite} · Source: {item.source}</p><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4"><Link href={`/training/symm?topic=${encodeURIComponent(`Teach me ${item.title} from first principles for competitive programming.`)}&goal=competitive`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Learn with Symm AI <ArrowRight size={13} /></Link><a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Read at {item.source} <ExternalLink size={13} /></a></div></article>)}</div>
    {!visible.length && <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">No resources match these filters.</p>}
    <p className="text-xs text-muted-foreground">Original guides remain with their publishers. AlgoGym links to them and does not republish their lessons.</p>
  </div></Layout>;
}
