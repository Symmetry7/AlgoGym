import { AppShell } from "@/components/shell/shells";

const block = "animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] motion-reduce:animate-none";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 md:py-14" aria-busy="true" aria-label="Loading your progress">
        <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none" />
        <div className="mt-3 h-9 w-72 animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={`${block} col-span-2 h-44`} /><div className={`${block} h-44`} /><div className={`${block} h-44`} />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3"><div className={`${block} h-44`} /><div className={`${block} h-72`} /></div>
          <div className="space-y-3"><div className={`${block} h-56`} /><div className={`${block} h-40`} /></div>
        </div>
      </div>
    </AppShell>
  );
}
