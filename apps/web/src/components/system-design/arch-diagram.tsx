"use client";

import { animate, stagger, svg, type JSAnimation } from "animejs";
import { Cloud, Cog, Database, Layers, Monitor, Network, Pause, Play, Server, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { focusRing } from "@/components/shell/ui";
import { layoutDiagram, type Orientation } from "@/lib/arch-layout";
import type { Diagram, NodeKind } from "@/lib/lessons";
import { cn } from "@/lib/utils";

const ICONS: Record<NodeKind, LucideIcon> = { client: Monitor, edge: Network, service: Server, cache: Zap, store: Database, queue: Layers, worker: Cog, external: Cloud };

/** A system-design diagram from lesson data: drawn in by anime.js, then requests travel along each link.
 *  Static and fully drawn with reduced motion or without scripting; paused offscreen or on request. */
export function ArchDiagram({ diagram }: { diagram: Diagram }) {
  const [step, setStep] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const uid = useId().replace(/:/g, "");
  const wide = useMemo(() => layoutDiagram(diagram, "wide"), [diagram]);
  const active = step === null ? null : new Set(diagram.steps[step].edges);
  const names = new Map(diagram.nodes.map((n) => [n.id, n.label]));
  const props = { diagram, active, paused, uid };

  return (
    <figure className="my-10 text-pretty rounded-[20px] border border-ag-border bg-ag-surface-1 p-3 sm:p-6" aria-labelledby={`${uid}-title`}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-1 pt-1 sm:p-0">
        <figcaption id={`${uid}-title`} className="text-[15px] font-semibold text-ag-text">{diagram.title}</figcaption>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className={cn("sd-motion-toggle inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-ag-text-muted hover:text-ag-text active:scale-[0.97]", focusRing)}
        >
          {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
          {paused ? "Play motion" : "Pause motion"}
        </button>
      </div>

      <div className="mt-4">
        {/* One drawing per orientation; CSS shows one, and the hidden one never starts (it never intersects). */}
        <DiagramSvg {...props} orientation="wide" className={wide.width <= 680 ? "hidden md:block" : "hidden lg:block"} />
        <DiagramSvg {...props} orientation="tall" className={wide.width <= 680 ? "md:hidden" : "lg:hidden"} />
      </div>

      {diagram.steps.length > 0 && (
        <div className="mt-5 border-t border-ag-border px-1 pt-4 sm:px-0">
          <div role="group" aria-label="Walk through the flow" className="flex flex-wrap gap-2">
            {[null, ...diagram.steps.map((_, i) => i)].map((i) => {
              const on = step === i;
              return (
                <button
                  key={i ?? "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setStep(i)}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-medium active:scale-[0.97]",
                    focusRing,
                    on ? "border-ag-border-strong bg-ag-surface-3 text-ag-text" : "border-ag-border text-ag-text-muted hover:text-ag-text",
                  )}
                >
                  {i === null ? "Whole flow" : `${i + 1}. ${diagram.steps[i].label}`}
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="mt-3 min-h-[3em] max-w-[68ch] text-[14px] leading-relaxed text-ag-text-muted">
            {step === null ? "Pick a step to follow one request through the system." : diagram.steps[step].text}
          </p>
        </div>
      )}

      <details className="group mt-3 px-1 pb-1 sm:p-0">
        <summary className={cn("inline-flex cursor-pointer list-none items-center rounded-md text-[13px] text-ag-text-faint hover:text-ag-text-muted active:opacity-80 [&::-webkit-details-marker]:hidden", focusRing)}>
          <span className="group-open:hidden">Read the diagram as text</span>
          <span className="hidden group-open:inline">Hide the text version</span>
        </summary>
        <div id={`${uid}-desc`} className="mt-2 text-[14px] leading-relaxed text-ag-text-muted">
          <p>{diagram.description}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {diagram.edges.map((e, i) => (
              <li key={i}>
                {names.get(e.from)} to {names.get(e.to)}
                {e.label ? `, ${e.label}` : ""}
                {e.async ? " (asynchronous)" : ""}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </figure>
  );
}

type SvgProps = { diagram: Diagram; orientation: Orientation; active: Set<number> | null; paused: boolean; uid: string; className: string };

function DiagramSvg({ diagram, orientation, active, paused, uid, className }: SvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  const anims = useRef<JSAnimation[]>([]);
  const visible = useRef(false);
  const pausedRef = useRef(paused);
  const layout = useMemo(() => layoutDiagram(diagram, orientation), [diagram, orientation]);
  const lit = new Set(active ? diagram.edges.flatMap((e, i) => (active.has(i) ? [e.from, e.to] : [])) : []);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.armed = ""; // the svg's [data-armed] classes hide each part until anime.js draws it
    const start = () => {
      const delayOf = (base: number) => (t?: unknown) => base + Number((t as SVGElement).dataset.i) * 110;
      anims.current = [
        animate(el.querySelectorAll(".sd-node"), { opacity: [0, 1], translateY: [8, 0], ease: "outExpo", duration: 700, delay: stagger(70) }),
        animate(svg.createDrawable(el.querySelectorAll(".sd-edge")), { draw: ["0 0", "0 1"], opacity: [1, 1], ease: "inOutQuad", duration: 650, delay: delayOf(300) }),
        animate(el.querySelectorAll(".sd-after"), { opacity: [0, 1], ease: "outQuad", duration: 300, delay: delayOf(850) }),
        ...[...el.querySelectorAll<SVGPathElement>(".sd-edge")].map((path, i) => {
          const { translateX, translateY } = svg.createMotionPath(path);
          return animate(el.querySelector(`[data-packet="${i}"]`)!, {
            translateX,
            translateY,
            opacity: [0, 1, 1, 0],
            ease: "inOutSine",
            duration: 1500,
            delay: 1500 + i * 240,
            loop: true,
            loopDelay: 1100 + (i % 3) * 500,
          });
        }),
      ];
      if (pausedRef.current) anims.current.forEach((a) => a.pause());
    };
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (!entry.isIntersecting) return anims.current.forEach((a) => a.pause());
      if (!anims.current.length) start();
      else if (!pausedRef.current) anims.current.forEach((a) => a.resume());
    }, { threshold: 0.35 });
    io.observe(el);
    return () => {
      io.disconnect();
      anims.current.forEach((a) => a.revert());
      anims.current = [];
      delete el.dataset.armed;
    };
  }, [layout]);

  useEffect(() => {
    pausedRef.current = paused;
    anims.current.forEach((a) => (paused ? a.pause() : visible.current && a.resume()));
  }, [paused]);

  const dim = (on: boolean) => (active && !on ? "opacity-20" : "opacity-100");

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-desc`}
      className={cn("mx-auto h-auto w-full [&[data-armed]_.sd-after]:opacity-0 [&[data-armed]_.sd-edge]:opacity-0 [&[data-armed]_.sd-node]:opacity-0", className)}
      style={{ maxWidth: layout.width }}
    >
      {layout.edges.map((e) => {
        const on = !active || active.has(e.index);
        return (
          <g key={e.index} className={cn("transition-opacity duration-ag-panel", dim(on))}>
            <path
              className="sd-edge"
              data-i={e.index}
              d={e.d}
              fill="none"
              strokeWidth={on && active ? 1.75 : 1.25}
              strokeLinecap="round"
              strokeDasharray={e.async ? "4 5" : undefined}
              stroke={on && active ? "var(--ag-accent)" : "var(--ag-light-5)"}
            />
            <path className="sd-after" data-i={e.index} d={e.head} fill={on && active ? "var(--ag-accent)" : "var(--ag-light-5)"} />
            {e.label && (
              <g className="sd-after" data-i={e.index}>
                <rect x={e.labelX - e.label.length * 3.3 - 6} y={e.labelY - 9} width={e.label.length * 6.6 + 12} height={18} rx={9} fill="var(--ag-surface-1)" stroke="var(--ag-border)" />
                <text x={e.labelX} y={e.labelY + 3.5} textAnchor="middle" fontSize={10.5} className="font-geist-mono" fill="var(--ag-text-muted)">
                  {e.label}
                </text>
              </g>
            )}
            <circle data-packet={e.index} r={3.5} cx={0} cy={0} opacity={0} fill="var(--ag-accent)" />
          </g>
        );
      })}
      {layout.nodes.map((n) => {
        const Icon = ICONS[n.kind];
        const on = !active || lit.has(n.id);
        const highlight = n.accent || (active && on);
        // Wide: icon, then text from the left. Tall nodes are narrower, so the text is centred with no icon.
        const tx = layout.icon ? 36 : n.w / 2;
        const anchor = layout.icon ? "start" : "middle";
        return (
          // The outer group holds the position; anime.js moves only the inner one, so it never clobbers the transform.
          <g key={n.id} transform={`translate(${n.px} ${n.py})`} className={cn("transition-opacity duration-ag-panel", dim(on))}>
            <g className="sd-node">
              <rect width={n.w} height={n.h} rx={12} fill="var(--ag-surface-2)" stroke={highlight ? "var(--ag-accent)" : "var(--ag-border-strong)"} />
              {layout.icon && <Icon x={12} y={(n.h - 16) / 2} width={16} height={16} strokeWidth={1.6} color={highlight ? "var(--ag-accent)" : "var(--ag-text-muted)"} aria-hidden />}
              <text x={tx} y={n.sub ? n.h / 2 - 3 : n.h / 2 + 4} textAnchor={anchor} fontSize={layout.font} className="font-geist-mono" fill="var(--ag-text)">
                {n.label}
              </text>
              {n.sub && (
                <text x={tx} y={n.h / 2 + 12} textAnchor={anchor} fontSize={layout.font - 1.5} className="font-geist-mono" fill="var(--ag-text-faint)">
                  {n.sub}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
