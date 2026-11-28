import { cn } from "@/lib/utils";

/**
 * Algogym's original mascot: an emerald turtle in a full black ninja hood (eye slit only) with a code-bracket badge
 * on its shell. Deliberately not modelled on any existing character: no coloured eye masks, weapons or names.
 */
export function Mascot({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={cn("overflow-visible", className)}>
      <g className={animated ? "ag-mascot-bob" : undefined}>
        {/* shadow */}
        <ellipse cx="58" cy="108" rx="34" ry="5" fill="rgba(0,0,0,0.45)" className={animated ? "ag-mascot-shadow" : undefined} />
        {/* feet */}
        <ellipse cx="34" cy="98" rx="9" ry="6" fill="#2fbf7f" />
        <ellipse cx="78" cy="98" rx="9" ry="6" fill="#2fbf7f" />
        {/* shell */}
        <path d="M14 84c0-24 18-40 42-40s42 16 42 40c0 8-6 12-14 12H28c-8 0-14-4-14-12z" fill="#0d5c3a" />
        <path d="M22 84c0-19 15-32 34-32s34 13 34 32" fill="none" stroke="#1d8a56" strokeWidth="3" />
        <path d="M56 52v36M36 62l10 10M76 62l-10 10" stroke="#1d8a56" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 86h84" stroke="#08402a" strokeWidth="4" strokeLinecap="round" />
        {/* code-bracket badge */}
        <rect x="44" y="66" width="24" height="16" rx="5" fill="#062b1c" />
        <path d="M52 70l-4 4 4 4M60 70l4 4-4 4" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* neck and head, attached to the front of the shell */}
        <rect x="76" y="58" width="16" height="22" rx="7" fill="#2fbf7f" />
        <g className={animated ? "ag-mascot-head" : undefined}>
          <defs>
            <clipPath id="ag-mascot-head-clip"><circle cx="92" cy="50" r="19" /></clipPath>
          </defs>
          <circle cx="92" cy="50" r="19" fill="#34d399" />
          {/* full ninja hood: everything but a band across the eyes (same circle, clipped) */}
          <g clipPath="url(#ag-mascot-head-clip)" fill="#111114">
            <rect x="70" y="28" width="44" height="17" />
            <rect x="70" y="57" width="44" height="14" />
          </g>
          <circle cx="92" cy="50" r="19" fill="none" stroke="#0b0b0d" strokeWidth="1.5" opacity="0.6" />
          {/* hood knot and tails */}
          <circle cx="74" cy="40" r="4.2" fill="#111114" />
          <path d="M72 40c-8-3-15 1-19 7M72 43c-6 3-9 8-10 13" stroke="#111114" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          {/* eyes in the open band */}
          <g className={animated ? "ag-mascot-blink" : undefined}>
            <ellipse cx="86" cy="51" rx="4" ry="3.6" fill="#fff" />
            <ellipse cx="99" cy="51" rx="4" ry="3.6" fill="#fff" />
            <circle cx="87.2" cy="51.4" r="1.9" fill="#111114" />
            <circle cx="100.2" cy="51.4" r="1.9" fill="#111114" />
            <circle cx="87.8" cy="50.6" r="0.6" fill="#fff" />
            <circle cx="100.8" cy="50.6" r="0.6" fill="#fff" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Full-area loader: the mascot bobbing, with a short label. Static (no bob or blink) with reduced motion. */
export function MascotLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Mascot animated className="size-24" />
      <p className="flex items-center gap-1 text-[14px] text-ag-text-muted">
        {label}
        <span aria-hidden className="ag-mascot-dots inline-flex gap-0.5"><span>.</span><span>.</span><span>.</span></span>
      </p>
    </div>
  );
}
