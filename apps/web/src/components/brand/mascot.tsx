import { cn } from "@/lib/utils";

/**
 * Algogym's mascot (owner's pick, design 1 of the 2026-11-28 sheet): a dark green turtle head with a red bandana,
 * white eye slits and two knot tails. Colours come from the --ag-mascot-* tokens.
 */
export function Mascot({ className, animated = false, title }: { className?: string; animated?: boolean; title?: string }) {
  return (
    <svg viewBox="0 0 132 100" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className={cn("overflow-visible", className)}>
      <g className={animated ? "ag-mascot-bob" : undefined}>
        {/* head: a dome over broader cheeks and a soft, flat chin */}
        <path
          d="M60 6C38 6 24 20 22 40c-1 6 0 10-2 14-4 7-9 12-7 20 2 9 13 14 24 17 7 2 15 3 23 3s16-1 23-3c11-3 22-8 24-17 2-8-3-13-7-20-2-4-1-8-2-14C96 20 82 6 60 6z"
          fill="var(--ag-mascot-skin)"
        />
        {/* bandana band across the eyes */}
        <path d="M9 44c18-6 41-8 62-7 12 1 22 2 31 4l1 16c-12-2-25-3-38-3-19 0-39 3-53 8z" fill="var(--ag-mascot-band)" />
        {/* knot tails, flying back */}
        <g className={animated ? "ag-mascot-tail" : undefined}>
          <path d="M100 40l27-5-10 16z" fill="var(--ag-mascot-band)" />
          <path d="M102 50l23 18-16 4z" fill="var(--ag-mascot-band)" />
        </g>
        {/* eye slits */}
        <g className={animated ? "ag-mascot-blink" : undefined} fill="var(--ag-mascot-eye)">
          <path d="M29 49c9 1 18 3 26 7l-1 2c-7 2-13 2-18 0-4-2-6-5-7-9z" />
          <path d="M93 49c-9 1-18 3-26 7l1 2c7 2 13 2 18 0 4-2 6-5 7-9z" />
        </g>
      </g>
    </svg>
  );
}

/** Full-area loader: the mascot bobbing, blinking, tails fluttering. Static with reduced motion. */
export function MascotLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Mascot animated className="h-20 w-auto" />
      <p className="flex items-center gap-1 text-[14px] text-ag-text-muted">
        {label}
        <span aria-hidden className="ag-mascot-dots inline-flex gap-0.5"><span>.</span><span>.</span><span>.</span></span>
      </p>
    </div>
  );
}
