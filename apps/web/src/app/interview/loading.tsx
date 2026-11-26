import { AppShell } from "@/components/shell/shells";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-10 sm:px-6 md:pt-14" aria-busy="true" aria-label="Loading interview questions">
        <div className="h-12 w-72 max-w-full animate-pulse rounded-ag-control bg-ag-surface-2 motion-reduce:animate-none" />
        <div className="mt-4 h-5 w-[min(560px,100%)] animate-pulse rounded bg-ag-surface-2 motion-reduce:animate-none" />
        <div className="mt-10 h-11 w-60 animate-pulse rounded-full bg-ag-surface-2 motion-reduce:animate-none" />
        <div className="mt-6 overflow-hidden rounded-ag-card border border-ag-border bg-ag-surface-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="border-b border-ag-border px-5 py-4 last:border-b-0">
              <div className="h-4 w-3/4 animate-pulse rounded bg-ag-surface-3 motion-reduce:animate-none" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-ag-surface-2 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
