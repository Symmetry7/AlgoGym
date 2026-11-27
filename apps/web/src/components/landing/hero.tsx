"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const glassBtn = cn("ag-glass-button inline-flex h-12 items-center rounded-2xl px-5 text-[16px] font-semibold text-white transition-[filter] duration-ag-hover hover:brightness-125", focusRing);

export function Hero({ companies }: { companies: { slug: string; name: string }[] }) {
  const root = useRef<HTMLElement>(null);
  const art = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-in]", { y: 24, opacity: 0, filter: "blur(6px)", duration: 1.1, ease: "expo.out", stagger: 0.08 });
        gsap.from(art.current, { opacity: 0, scale: 0.94, duration: 1.6, ease: "expo.out", delay: 0.2 });
        // Slow float, plus a gentle tilt towards the pointer (fine pointers only).
        gsap.to("[data-float]", { y: -14, rotate: 1.5, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });
        const rx = gsap.quickTo(art.current, "rotationY", { duration: 1.2, ease: "power3.out" });
        const ry = gsap.quickTo(art.current, "rotationX", { duration: 1.2, ease: "power3.out" });
        const move = (e: PointerEvent) => { rx((e.clientX / innerWidth - 0.5) * 14); ry((e.clientY / innerHeight - 0.5) * -10); };
        if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", move);
        return () => removeEventListener("pointermove", move);
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
          <h1 data-in className="ag-text-gradient mt-7 pb-2 font-display text-[56px] leading-[1] tracking-[-0.01em] sm:text-[80px] lg:text-[96px]">
            Interview prep
            <br />
            for developers
          </h1>
          <p data-in className="mt-5 max-w-[470px] text-pretty text-[18px] leading-[1.5] text-[#a1a4a5]">
            The clearest way from your first array to your offer. Roadmaps, free lessons and real problems, built for your target company.
          </p>
          <div data-in className="mt-9 flex flex-wrap items-center gap-2">
            <Link href="/sign-in" className={glassBtn}>Get started</Link>
            <Link href="/problems" className={cn("inline-flex h-12 items-center rounded-2xl px-5 text-[16px] font-semibold text-[#a1a4a5] transition-colors duration-ag-hover hover:text-white", focusRing)}>Browse problems</Link>
          </div>
        </div>

        <div className="relative [perspective:1200px]">
          <div ref={art} className="mx-auto w-full max-w-[520px] [transform-style:preserve-3d]">
            <div data-float>
              <Image src="/hero/algogym-cubes-poster.webp" alt="" width={1200} height={1200} priority className="h-auto w-full select-none drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] [filter:saturate(0.55)_brightness(0.8)]" />
            </div>
          </div>
        </div>
      </div>

      {companies.length > 0 && (
        <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 sm:px-6">
          <p className="text-center text-[14px] text-ag-text-faint">Practise the problems asked at</p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {companies.map((c) => (
              <li key={c.slug}>
                <Link href={`/problems?company=${c.slug}`} className={cn("group flex items-center gap-2.5 rounded-sm opacity-60 transition-opacity duration-ag-hover hover:opacity-100", focusRing)}>
                  <Image src={`/company-icons/${c.slug}.png`} alt="" width={22} height={22} unoptimized className="size-[22px] rounded-[5px] object-contain grayscale" />
                  <span className="text-[17px] font-semibold tracking-[-0.01em] text-white">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
