"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

const arrow = cn(
  "inline-flex size-8 items-center justify-center rounded-full border border-white/10 text-ag-text-muted",
  "transition-colors duration-ag-hover ease-ag hover:border-white/20 hover:text-ag-text active:bg-white/[0.08] disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:text-ag-text-muted",
  focusRing,
);

/** A titled horizontal rail: native scroll (swipe, trackpad, keyboard via Tab) plus previous/next buttons. */
export function Scroller({ title, action, label, children }: { title: ReactNode; action?: ReactNode; label: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  const by = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <section aria-label={label}>
      <div className="flex items-center gap-3">
        <h2 className="font-ui text-[15px] font-semibold text-ag-text">{title}</h2>
        <div className="ml-auto flex items-center gap-2">
          {action}
          <button type="button" onClick={() => by(-1)} disabled={edge.start} aria-label="Scroll back" className={arrow}><ChevronLeft size={16} aria-hidden /></button>
          <button type="button" onClick={() => by(1)} disabled={edge.end} aria-label="Scroll forward" className={arrow}><ChevronRight size={16} aria-hidden /></button>
        </div>
      </div>
      <ul ref={ref} className={cn("-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden", !edge.end && "sm:[mask-image:linear-gradient(90deg,var(--ag-bg)_88%,transparent)]")}>
        {children}
      </ul>
    </section>
  );
}
