"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

// three.js loads only here, after first paint.
const CubeScene = dynamic(() => import("./cube-scene"), { ssr: false });

const glassBtn = cn("ag-glass-button inline-flex h-12 items-center rounded-2xl px-5 text-[16px] font-semibold text-white transition-[filter] duration-ag-hover hover:brightness-125", focusRing);

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [webgl, setWebgl] = useState(true);
  const onFail = useCallback(() => setWebgl(false), []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-in]", { y: 24, opacity: 0, filter: "blur(6px)", duration: 1.1, ease: "expo.out", stagger: 0.08 });
        gsap.from("[data-art]", { opacity: 0, scale: 0.92, duration: 1.8, ease: "expo.out", delay: 0.15 });
        // The hand-drawn underline sweeps in under the key word once the headline lands.
        gsap.fromTo("[data-underline]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power3.inOut", delay: 0.75 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative isolate -mt-16 overflow-hidden">
      {/* Spotlight from the top right and a faint diagonal light streak */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_85%_-10%,rgba(255,255,255,0.13),transparent_60%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-[10%] bottom-[8%] -z-10 h-28 w-[130%] -rotate-[7deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.07)_35%,rgba(255,255,255,0.1)_55%,transparent)] blur-2xl" />

      <div className="mx-auto grid min-h-dvh w-full max-w-[1200px] items-center gap-10 px-4 pb-16 pt-24 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
        <div>
          <Link data-in href="/problems" className={cn("group inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.03] py-1.5 pl-3.5 pr-2.5 text-[14px] text-ag-text transition-colors duration-ag-hover hover:bg-white/[0.07]", focusRing)}>
            Run and Submit, now in 4 languages
            <ChevronRight className="size-4 text-ag-text-muted transition-transform duration-ag-hover group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <h1 data-in className="mt-7 text-balance font-ui text-[46px] font-bold leading-[1.02] tracking-[-0.035em] text-[#f0f0f0] sm:text-[64px] lg:text-[76px]">
            Walk into your interview{" "}
            <span className="relative inline-block whitespace-nowrap text-ag-accent">
              ready
              <svg aria-hidden viewBox="0 0 200 16" preserveAspectRatio="none" className="absolute -bottom-[0.12em] left-0 h-[0.2em] w-full overflow-visible">
                <path data-underline d="M3 11 C 50 3, 120 3, 197 9" pathLength={1} strokeDasharray="1" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>
          <p data-in className="mt-5 max-w-[470px] text-pretty text-[18px] leading-[1.5] text-[#a1a4a5]">
            The clearest way from your first array to your offer. Roadmaps, free lessons and real problems, built for your target company.
          </p>
          <div data-in className="mt-9 flex flex-wrap items-center gap-2">
            <Link href="/sign-in" className={glassBtn}>Get started</Link>
            <Link href="/problems" className={cn("inline-flex h-12 items-center rounded-2xl px-5 text-[16px] font-semibold text-[#a1a4a5] transition-colors duration-ag-hover hover:text-white", focusRing)}>Browse problems</Link>
          </div>
        </div>

        <div data-art className="relative mx-auto aspect-square w-full max-w-[600px]">
          {webgl ? <CubeScene onFail={onFail} /> : <Image src="/hero/algogym-cubes-poster.webp" alt="" fill sizes="600px" className="object-contain [filter:saturate(0.55)_brightness(0.8)]" />}
        </div>
      </div>

    </section>
  );
}
