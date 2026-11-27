import { AppShell } from "@/components/shell/shells";

const pulse = "animate-pulse motion-reduce:animate-none";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-8 sm:px-6 lg:pl-[268px] xl:pr-[348px]" aria-busy="true" aria-label="Loading problems">
        <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className={`h-20 rounded-ag-card bg-ag-surface-2 ${pulse}`} />)}</div>
        <div className={`mt-10 h-11 w-48 rounded-ag-control bg-ag-surface-2 ${pulse}`} />
        <div className={`mt-6 h-10 w-full rounded-ag-control bg-ag-surface-2 ${pulse}`} />
        <div className="mt-6 overflow-hidden rounded-ag-card border border-ag-border">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex h-14 items-center gap-4 border-b border-ag-border px-5 last:border-b-0">
              <div className={`h-4 flex-1 rounded bg-ag-surface-3 ${pulse}`} />
              <div className={`h-4 w-14 rounded bg-ag-surface-2 ${pulse}`} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
