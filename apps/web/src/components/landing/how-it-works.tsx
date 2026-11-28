"use client";

import { useGSAP } from "@gsap/react";
import { animate, stagger } from "animejs";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChecklistDemo, HintsDemo, PlanDemo, RoadmapDemo } from "./demos";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STEPS: { title: string; body: string; demo: ReactNode }[] = [
  { title: "Pick your target", body: "Choose the company, how many weeks you have and how many hours a day. You get a week-by-week plan that fits your calendar.", demo: <PlanDemo /> },
  { title: "Skip what you already know", body: "Tick off the topics you're sure of. Everything else becomes a short lesson, placed just before the problems that need it.", demo: <ChecklistDemo /> },
  { title: "Unlock your roadmap", body: "Each topic opens when you pass the one before it, so you always know what's next and why it matters.", demo: <RoadmapDemo /> },
  { title: "Get unstuck, one hint at a time", body: "Hints open in order, from a gentle nudge to the key idea. The last one still stops short of the code.", demo: <HintsDemo /> },
];

/** Scroll-driven steps: the list scrolls past a pinned visual; the active step lights up and its demo cascades in. */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el, i) => {
          ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && setActive(i) });
        });
        gsap.fromTo("[data-rail]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-steps]", start: "top 55%", end: "bottom 55%", scrub: 0.4 } });
      });
    },
    { scope: root },
  );

  // Cascade the new demo's rows in each time the step changes (desktop pinned panel only).
  useEffect(() => {
    const el = panel.current?.querySelector(`[data-visual="${active}"]`);
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = animate(el.querySelectorAll("li, button, label"), { opacity: [0, 1], translateY: [10, 0], ease: "outExpo", duration: 700, delay: stagger(35) });
    return () => { a.revert(); };
  }, [active]);

  return (
    <section ref={root} aria-labelledby="how" className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-[640px] text-center">
        <h2 id="how" className="text-[#f0f0f0] pb-1 font-display text-[40px] leading-none sm:text-[56px]">How it works</h2>
        <p className="mt-5 text-pretty text-[18px] leading-[1.5] text-[#a1a4a5]">From a blank plan to a confident interview, in four steps that adapt to you.</p>
      </div>

      {/* Desktop: steps on the left, pinned visual on the right */}
      <div className="mt-20 hidden gap-16 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ol data-steps className="relative pl-8">
          <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-white/10" />
          <span aria-hidden data-rail className="absolute left-0 top-0 h-full w-px origin-top bg-gradient-to-b from-white to-white/40" />
          {STEPS.map((s, i) => (
            <li key={s.title} data-step className="flex min-h-[62vh] flex-col justify-center">
              <div className={cn("transition-[opacity,transform] duration-500 ease-ag motion-reduce:transition-none", active === i ? "opacity-100" : "translate-x-[-4px] opacity-35")}>
                <p className="font-geist-mono text-[13px] text-[#a1a4a5]">0{i + 1}</p>
                <h3 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[#f0f0f0]">{s.title}</h3>
                <p className="mt-4 max-w-[400px] text-pretty text-[17px] leading-[1.6] text-[#a1a4a5]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="relative">
          <div ref={panel} className="sticky top-[18vh] h-[64vh] min-h-[460px]">
            <div aria-hidden className="absolute -inset-10 rounded-[40px] bg-[radial-gradient(ellipse_60%_55%_at_60%_40%,rgba(255,255,255,0.07),transparent_70%)]" />
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                data-visual={i}
                aria-hidden={active !== i}
                inert={active !== i}
                className={cn("absolute inset-0 flex items-center transition-[opacity,transform,filter] duration-700 ease-ag motion-reduce:transition-none", active === i ? "scale-100 opacity-100 blur-0" : "pointer-events-none scale-[0.97] opacity-0 blur-[6px]")}
              >
                <div className="w-full">{s.demo}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile and tablet: each step followed by its demo */}
      <ol className="mt-14 space-y-16 lg:hidden">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <p className="font-geist-mono text-[13px] text-[#a1a4a5]">0{i + 1}</p>
            <h3 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#f0f0f0]">{s.title}</h3>
            <p className="mt-3 text-pretty text-[16px] leading-[1.6] text-[#a1a4a5]">{s.body}</p>
            <div className="mt-6">{s.demo}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
