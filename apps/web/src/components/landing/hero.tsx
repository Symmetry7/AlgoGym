"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Check, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { buttonClass, focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrambleTextPlugin);

type Tok = [string, "k" | "f" | "n" | "s" | "c" | ""];
// Two Sum in Python, tokenised for colouring.
const CODE: Tok[][] = [
  [["def ", "k"], ["two_sum", "f"], ["(nums, target):", ""]],
  [["    seen ", ""], ["= {}", ""]],
  [["    for ", "k"], ["i, x ", ""], ["in ", "k"], ["enumerate", "f"], ["(nums):", ""]],
  [["        if ", "k"], ["target - x ", ""], ["in ", "k"], ["seen:", ""]],
  [["            return ", "k"], ["[seen[target - x], i]", ""]],
  [["        seen[x] ", ""], ["= i", ""]],
];
const TONE = { k: "text-[#c792ea]", f: "text-[#82aaff]", n: "text-[#f78c6c]", s: "text-[#c3e88d]", c: "text-ag-text-faint", "": "text-ag-text" } as const;

const CHECKS = [
  { name: "Example 1", ms: 12 },
  { name: "Example 2", ms: 9 },
  { name: "Hidden · 10⁵ numbers", ms: 41 },
  { name: "Hidden · negatives", ms: 11 },
  { name: "Hidden · duplicates", ms: 10 },
  { name: "Hidden · pair at the end", ms: 38 },
];

const LANGS = ["Python", "JavaScript", "C++", "Java"];

export function Hero({ companies }: { companies: { slug: string; name: string }[] }) {
  const root = useRef<HTMLElement>(null);
  const editor = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-in]", { y: 28, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.07 });
        gsap.from("[data-editor]", { y: 40, opacity: 0, rotateX: 8, duration: 1.2, ease: "expo.out", delay: 0.25 });
        gsap.to("[data-scramble]", { duration: 1.6, delay: 0.5, scrambleText: { text: "ready.", chars: "{}[]<>=+01", speed: 0.5, revealDelay: 0.4 } });

        // The editor loop: type, run, tick each test, show the verdict. Paused while offscreen.
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true });
        tl.set("[data-line]", { opacity: 0, x: -8 })
          .set("[data-check]", { opacity: 0.3 })
          .set("[data-tick]", { scale: 0 })
          .set("[data-ms]", { opacity: 0 })
          .set("[data-bar]", { scaleX: 0 })
          .set("[data-verdict]", { opacity: 0, y: 8 })
          .to("[data-line]", { opacity: 1, x: 0, duration: 0.35, stagger: 0.16, ease: "power2.out" }, 0.3)
          .to("[data-run]", { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1 }, "+=0.35")
          .to("[data-check]", { opacity: 1, duration: 0.2, stagger: 0.3 }, "+=0.15")
          .to("[data-tick]", { scale: 1, duration: 0.35, stagger: 0.3, ease: "back.out(3)" }, "<")
          .to("[data-ms]", { opacity: 1, duration: 0.2, stagger: 0.3 }, "<")
          .to("[data-bar]", { scaleX: 1, duration: CHECKS.length * 0.3, ease: "none" }, "<")
          .to("[data-verdict]", { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" });
        const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.2 });
        if (editor.current) io.observe(editor.current);
        return () => io.disconnect();
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      {/* Graphite light behind the editor */}
      <div aria-hidden className="pointer-events-none absolute right-[-10%] top-[-20%] h-[640px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.07),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1fr_1.08fr] lg:gap-14 lg:pb-24">
        <div>
          <p data-in className="inline-flex items-center gap-2 rounded-full border border-ag-border bg-ag-graphite-1 px-3 py-1 text-[13px] text-ag-text-muted">
            <span className="size-1.5 rounded-full bg-ag-accent" aria-hidden />
            Run and Submit now live in 4 languages
          </p>
          <h1 className="mt-6 font-display text-[50px] leading-[0.95] tracking-[-0.015em] text-ag-text sm:text-[76px] lg:text-[88px]">
            <span data-in className="block">Walk into your</span>
            <span data-in className="block">
              interview <span data-scramble className="text-ag-text">ready.</span>
            </span>
          </h1>
          <p data-in className="mt-6 max-w-[500px] text-pretty text-[17px] leading-relaxed text-ag-text-muted">
            A roadmap built around the company you want, free lessons for every topic, and problems with hidden tests you solve right in your browser.
          </p>
          <ul data-in className="mt-6 flex flex-wrap gap-2" aria-label="Languages">
            {LANGS.map((l) => (
              <li key={l} className="rounded-md border border-ag-border bg-ag-graphite-1 px-2.5 py-1 font-geist-mono text-[12px] text-ag-text-muted">{l}</li>
            ))}
          </ul>
          <div data-in className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/problems" className={buttonClass("primary")}>Explore problems</Link>
            <Link href="/sign-in" className={buttonClass("secondary")}>Start free</Link>
          </div>
        </div>

        {/* Live editor */}
        <div ref={editor} data-editor className="[perspective:1400px]">
          <div className="ag-graphite-card overflow-hidden rounded-[20px]">
            <div className="flex items-center gap-2 border-b border-ag-border px-4 py-3">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-white/15" /><span className="size-2.5 rounded-full bg-white/15" /><span className="size-2.5 rounded-full bg-white/15" />
              </span>
              <span className="ml-2 font-geist-mono text-[12px] text-ag-text-muted">two_sum.py</span>
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-ag-accent px-3 py-1 text-[12px] font-semibold text-ag-on-accent" data-run>
                <Play className="size-3 fill-current" aria-hidden /> Run
              </span>
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-geist-mono text-[12.5px] leading-[1.75] sm:text-[13px]" aria-label="Sample solution">
              {CODE.map((line, i) => (
                <div key={i} data-line className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-ag-text-faint/60">{i + 1}</span>
                  <code className="ml-4 whitespace-pre">{line.map(([t, k], j) => <span key={j} className={TONE[k]}>{t}</span>)}</code>
                </div>
              ))}
            </pre>
            <div className="border-t border-ag-border bg-black/20 px-4 py-4">
              <div className="flex items-center justify-between text-[12px] text-ag-text-faint">
                <span>Tests</span>
                <span className="font-geist-mono">hidden inputs never leave the server</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div data-bar className="h-full origin-left rounded-full bg-ag-accent" />
              </div>
              <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {CHECKS.map((c) => (
                  <li key={c.name} data-check className="flex items-center gap-2 text-[12.5px] text-ag-text-muted">
                    <span data-tick className="grid size-4 shrink-0 place-items-center rounded-full bg-ag-accent-soft text-ag-accent"><Check className="size-2.5" strokeWidth={3} aria-hidden /></span>
                    <span className="truncate">{c.name}</span>
                    <span data-ms className="ml-auto font-geist-mono text-[11.5px] tabular-nums text-ag-text-faint">{c.ms} ms</span>
                  </li>
                ))}
              </ul>
              <p data-verdict className="mt-4 flex items-baseline gap-3 font-ui">
                <span className="text-[15px] font-semibold text-ag-accent">Accepted</span>
                <span className="text-[12.5px] text-ag-text-muted">6 / 6 passed · O(n) time</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asked at */}
      {companies.length > 0 && (
        <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-6 sm:px-6">
          <p className="text-[13px] text-ag-text-faint">Problems asked at</p>
          <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3">
            {companies.map((c) => (
              <li key={c.slug}>
                <Link href={`/problems?company=${c.slug}`} className={cn("group flex items-center gap-2.5 rounded-full border border-ag-border bg-ag-graphite-1 py-1.5 pl-1.5 pr-3.5 transition-colors duration-ag-hover hover:border-ag-border-strong hover:bg-ag-graphite-2", focusRing)}>
                  <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-white">
                    <Image src={`/company-icons/${c.slug}.png`} alt="" width={18} height={18} unoptimized className="size-[18px] object-contain grayscale transition-[filter] duration-ag-hover group-hover:grayscale-0" />
                  </span>
                  <span className="text-[13.5px] text-ag-text-muted group-hover:text-ag-text">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
