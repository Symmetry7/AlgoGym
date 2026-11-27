"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StoredResults } from "@/lib/judge-results";

export type JudgeMode = "run" | "submit";
export type JudgeState =
  | { phase: "idle" }
  | { phase: "running"; mode: JudgeMode }
  | { phase: "done"; mode: JudgeMode; verdict: string; results: StoredResults; runtimeMs: number | null }
  | { phase: "error"; mode: JudgeMode; message: string; signIn?: boolean };

type Row = { status: string; verdict: string | null; results: (StoredResults & { message?: string }) | null; runtime_ms: number | null; mode: JudgeMode };

const POLL_MS = 2000;
const GIVE_UP_MS = 90_000; // beyond the function limit (60 s) plus queueing: the run failed or was lost

/** Starts a Run or Submit and follows it to the end: Realtime first, polling as the fallback (M11). */
export function useJudge(slug: string) {
  const [state, setState] = useState<JudgeState>({ phase: "idle" });
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => () => cleanup.current(), []);

  const start = useCallback(async (mode: JudgeMode, lang: string, code: string, custom?: unknown[][]) => {
    cleanup.current();
    setState({ phase: "running", mode });
    let res: Response;
    try {
      res = await fetch("/api/judge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, lang, code, mode, ...(custom?.length ? { custom } : {}) }) });
    } catch {
      setState({ phase: "error", mode, message: "You seem to be offline. Your code is saved in this browser; try again when you're back." });
      return;
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState({ phase: "error", mode, message: body.error ?? "Couldn't start the run. Your code is saved; try again.", signIn: res.status === 401 });
      return;
    }

    const id: string = body.id;
    let finished = false;
    let channel: RealtimeChannel | null = null;
    let client: SupabaseClient | null = null;
    const finish = (row: Row) => {
      if (finished || (row.status !== "done" && row.status !== "error")) return;
      finished = true;
      cleanup.current();
      if (row.status === "error") setState({ phase: "error", mode, message: row.results?.message ?? "Judging failed. Your code is saved; try again." });
      else setState({ phase: "done", mode, verdict: row.verdict ?? "accepted", results: row.results ?? { cases: [] }, runtimeMs: row.runtime_ms });
    };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key && body.token) {
      client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      client.realtime.setAuth(body.token);
      channel = client
        .channel(`submission-${id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "submissions", filter: `id=eq.${id}` }, (payload) => finish(payload.new as Row))
        .subscribe();
    }
    const startedAt = Date.now();
    const poll = setInterval(async () => {
      if (Date.now() - startedAt > GIVE_UP_MS) {
        finished = true;
        cleanup.current();
        setState({ phase: "error", mode, message: "This is taking much longer than usual. Your code is saved; try again in a minute." });
        return;
      }
      try {
        const r = await fetch(`/api/judge/${id}`, { cache: "no-store" });
        if (r.ok) finish(await r.json());
      } catch { /* keep polling */ }
    }, POLL_MS);
    cleanup.current = () => {
      clearInterval(poll);
      if (channel && client) void client.removeChannel(channel);
    };
  }, [slug]);

  return { state, start };
}
