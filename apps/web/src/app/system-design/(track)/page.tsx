import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/shells";
import { focusRing } from "@/components/shell/ui";
import { ArchDiagram } from "@/components/system-design/arch-diagram";
import { DoneMark, NextLessonLink, TrackProgress } from "@/components/system-design/progress";
import { panel, primaryAction } from "@/components/system-design/ui";
import type { Diagram } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { headerActions } from "../header-actions";
import { getLessons } from "../lessons";

export const metadata: Metadata = {
  title: "System design · Algogym",
  description: "Short, original system-design lessons for interviews: scaling, load balancing, caching, databases, sharding, queues, rate limiting, consistency and a full worked design.",
};

// Per request: the header reads the session (Supabase). Lessons come from content/learn/system-design.
export const dynamic = "force-dynamic";

// The system the track builds up, one lesson per box: shown on the overview as the map of the course.
const MAP: Diagram = {
  id: "track-map",
  title: "The system you will be able to draw by the end",
  description: "A typical web backend. Users reach a load balancer, which spreads requests over stateless app servers. The servers read from a Redis cache first and fall back to a Postgres primary, which copies its changes to a read replica. Slow work goes onto a job queue that background workers drain.",
  nodes: [
    { id: "users", label: "Users", sub: "phones, laptops", x: 0, y: 1, kind: "client" },
    { id: "lb", label: "Load balancer", x: 1, y: 1, kind: "edge", accent: true },
    { id: "app", label: "App servers", sub: "stateless, x3", x: 2, y: 1, kind: "service" },
    { id: "cache", label: "Redis cache", x: 3, y: 0, kind: "cache" },
    { id: "db", label: "Postgres", sub: "primary", x: 3, y: 1, kind: "store" },
    { id: "replica", label: "Read replica", x: 4, y: 1, kind: "store" },
    { id: "queue", label: "Job queue", x: 3, y: 2, kind: "queue" },
    { id: "worker", label: "Workers", sub: "email, images", x: 4, y: 2, kind: "worker" },
  ],
  edges: [
    { from: "users", to: "lb", label: "HTTPS" },
    { from: "lb", to: "app" },
    { from: "app", to: "cache", label: "GET" },
    { from: "app", to: "db", label: "SQL" },
    { from: "db", to: "replica", label: "replicate", async: true },
    { from: "app", to: "queue", label: "enqueue", async: true },
    { from: "queue", to: "worker" },
  ],
  steps: [
    { label: "Read", text: "A request lands on the load balancer, which picks a healthy app server. The server checks Redis first: a hit returns in about a millisecond without touching the database.", edges: [0, 1, 2] },
    { label: "Write", text: "Writes go to the Postgres primary, the one copy that accepts changes. The primary streams them to the replica a moment later, so the replica can serve reads that tolerate a little lag.", edges: [0, 1, 3, 4] },
    { label: "Slow work", text: "Sending an email or resizing an image shouldn't keep the user waiting. The app drops a job on the queue, replies at once, and a worker picks the job up in the background.", edges: [0, 1, 5, 6] },
  ],
};

export default async function SystemDesignTrack() {
  const [lessons, actions] = await Promise.all([getLessons(), headerActions("/system-design")]);
  const minutes = lessons.reduce((n, l) => n + l.minutes, 0);

  return (
    <AppShell actions={actions}>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-12 sm:px-6 md:pt-20">
        <header className="max-w-[640px]">
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ag-text [overflow-wrap:break-word] sm:text-[56px]">System design</h1>
          <p className="mt-5 text-pretty text-[18px] leading-relaxed text-ag-text-muted">
            {lessons.length} short lessons, from one server to a design you can defend in a 45-minute round.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <NextLessonLink lessons={lessons.map(({ slug, title }) => ({ slug, title }))} className={primaryAction} />
            <span className="text-[14px] text-ag-text-faint">About {minutes} minutes in all</span>
          </div>
          <TrackProgress slugs={lessons.map((l) => l.slug)} />
        </header>

        <ArchDiagram diagram={MAP} />

        <section aria-labelledby="lessons" className="mt-16">
          <h2 id="lessons" className="text-[24px] font-semibold tracking-[-0.015em] text-ag-text">Lessons</h2>
          <p className="mt-2 text-[15px] text-ag-text-muted">In order: each one leans on the ones before it.</p>
          <ol className="mt-6 grid gap-3 md:grid-cols-2">
            {lessons.map((l, i) => (
              <li key={l.slug} className="min-w-0">
                <Link
                  href={`/system-design/${l.slug}`}
                  className={cn(panel, "group flex h-full flex-col p-5 hover:border-ag-border-strong hover:bg-ag-surface-2 active:scale-[0.99] sm:p-6", focusRing)}
                >
                  <span className="font-geist-mono text-[13px] text-ag-text-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mt-3 text-[18px] font-semibold tracking-[-0.01em] text-ag-text">{l.title}</span>
                  <span className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-ag-text-muted">{l.summary}</span>
                  <span className="mt-auto flex items-center gap-4 pt-5 text-[13px] text-ag-text-faint">
                    <span>{l.minutes} min read</span>
                    <span>{l.quiz.length} quiz questions</span>
                    <DoneMark slug={l.slug} className="ml-auto" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
