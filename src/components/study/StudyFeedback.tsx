import { LoaderCircle } from "lucide-react";
import type { useStudy } from "@/hooks/use-study";
export function StudyFeedback({
  study,
}: {
  study: ReturnType<typeof useStudy>;
}) {
  return (
    <>
      {study.isLoading && (
        <p
          role="status"
          className="flex items-center gap-2 py-4 text-sm text-muted-foreground"
        >
          <LoaderCircle size={15} className="animate-spin" />
          Loading your saved study workspace…
        </p>
      )}
      {study.isError && (
        <div
          role="alert"
          className="rounded-md border border-rose-400/25 p-4 text-sm text-rose-300"
        >
          {study.error.message}
          <button
            className="ml-3 underline"
            onClick={() => void study.refetch()}
          >
            Retry
          </button>
        </div>
      )}
      {study.saveError && (
        <p
          role="alert"
          className="rounded-md border border-rose-400/25 p-3 text-xs text-rose-300"
        >
          {study.saveError.message}
        </p>
      )}
    </>
  );
}
