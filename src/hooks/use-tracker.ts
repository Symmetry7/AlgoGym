"use client";
import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "./use-account";
import type { TrackerData } from "@/lib/tracker-types";
export function useTracker(days = 365, provider = "all", autoSync = true) {
  const { user } = useAuth();
  const started = useRef("");
  const query = useQuery({
    queryKey: ["tracker", user?.id, days, provider],
    queryFn: () =>
      jsonRequest<TrackerData>(
        `/api/tracker?days=${days}&provider=${provider}`,
      ),
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: 1,
    refetchInterval: (state) =>
      state.state.data?.jobs.some((job) =>
        ["queued", "running", "retrying"].includes(job.status),
      )
        ? 5000
        : false,
  });
  const sync = async (platform?: string) => {
    const platforms = platform
      ? [platform]
      : (query.data?.accounts.map((account) => account.platform).filter((value) => value === "codeforces" || value === "leetcode") ?? []);
    for (const value of platforms)
      await jsonRequest("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: value }),
      });
    const refreshed = await query.refetch();
    if (refreshed.isError) throw refreshed.error;
  };
  useEffect(() => {
    if (!autoSync || !user || !query.data || started.current === user.id)
      return;
    started.current = user.id;
    const stale = query.data.accounts.filter((account) => {
      if (account.platform !== "codeforces" && account.platform !== "leetcode") return false;
      const snapshot = query.data.snapshots.find(
        (item) => item.provider === account.platform,
      );
      return (
        !snapshot?.last_synced_at ||
        Date.now() - Date.parse(snapshot.last_synced_at) > 15 * 60_000
      );
    });
    if (stale.length)
      void Promise.all(stale.map((account) => sync(account.platform))).catch(
        () => undefined,
      );
  }, [autoSync, user?.id, query.data]);
  return {
    ...query,
    sync,
    isSyncing:
      query.data?.jobs.some((job) =>
        ["queued", "running", "retrying"].includes(job.status),
      ) ?? false,
  };
}
