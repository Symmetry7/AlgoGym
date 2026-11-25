"use client";
import { useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useTracker } from "@/hooks/use-tracker";
export function TrackerFeedback({
  tracker,
}: {
  tracker: ReturnType<typeof useTracker>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sync = async () => {
    setBusy(true);
    setError("");
    try {
      await tracker.sync();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Sync could not be requested.",
      );
    } finally {
      setBusy(false);
    }
  };
  const updated = tracker.data?.snapshots
    .map((item) => item.last_synced_at)
    .filter(Boolean)
    .sort()
    .at(0);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {tracker.isSyncing
            ? "Sync in progress · saved data remains visible"
            : updated
              ? `Updated ${new Date(updated).toLocaleString()}`
              : "Awaiting first profile sync"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent"
          disabled={busy || tracker.isSyncing || !tracker.data?.accounts.length}
          onClick={() => void sync()}
        >
          {busy || tracker.isSyncing ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Sync profiles
        </Button>
      </div>
      {(error || tracker.isError) && (
        <p role="alert" className="text-xs text-amber-300">
          {error || tracker.error?.message}{" "}
          <button className="underline" onClick={() => void tracker.refetch()}>
            Retry
          </button>
        </p>
      )}
      {tracker.data?.jobs.some((job) => job.status === "failed") && (
        <p className="text-xs text-amber-300">
          A provider sync failed. Previously synchronized data is preserved;
          request a new sync to retry.
        </p>
      )}
    </div>
  );
}
