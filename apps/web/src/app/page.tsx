import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { ChecklistDemo, HintsDemo, PlanDemo, RoadmapDemo } from "@/components/landing/demos";
import { Reveal } from "@/components/landing/reveal";
import { Hero } from "@/components/landing/hero";
import { MarketingShell } from "@/components/shell/shells";
import { ButtonLink, focusRing, SoonBadge } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { getCatalog } from "../../server/problem-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Algogym · Walk into your interview ready",
  description: "A roadmap built around your target company, free lessons, and problems with hidden tests you solve in your browser.",
};

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";
// Statement card: black with a hairline and a soft top light (.claude/skills/premium-landing).
const slab = "rounded-[20px] border border-white/10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.06),transparent_70%)] p-6 text-ag-text sm:rounded-[24px] sm:p-10 lg:p-14";

const STEPS: { title: string; body: string; demo: ReactNode }[] = [
  { title: "Pick your target", body: "Tell us the company, the role, how many weeks you have and how many hours a day. You get a week-by-week plan that fits.", demo: <PlanDemo /> },
  { title: "Tick off what you already know", body: "Skip what you're sure of. Everything else becomes a short lesson, placed just before the problems that need it.", demo: <ChecklistDemo /> },
  { title: "Your roadmap is a path you unlock", body: "Each topic opens when you pass the one before it, so you always know what's next and why.", demo: <RoadmapDemo /> },
  { title: "Stuck? One hint at a time", body: "Hints open in order, from a nudge to the key idea. The last one still stops short of the code.", demo: <HintsDemo /> },
];

const EVIDENCE = [
  { title: "Recalling beats rereading", body: "Students who practised recalling a passage remembered more of it a week later than students who reread it.", source: "Roediger & Karpicke, Psychological Science, 2006", why: "That's why every lesson ends with a quiz, not a summary." },
  { title: "Spread out beats crammed", body: "Across hundreds of studies, practice spaced over days was remembered better than the same practice in one sitting.", source: "Cepeda et al., Psychological Bulletin, 2006", why: "That's why your plan brings old topics back in later weeks." },
  { title: "Worked examples help beginners", body: "Learners who studied worked examples first learned to solve new problems faster than those who only practised.", source: "Sweller & Cooper, Cognition and Instruction, 1985", why: "That's why each lesson walks through a solved problem before you try one." },
];

const FEATURES = [
  { title: "Roadmaps", body: "A path from arrays to dynamic programming, with a lesson and quiz at every step.", art: "roadmap" },
  { title: "Company prep", body: "See which problems each company asks most, from the last 30 days to all time.", art: "company" },
  { title: "Hidden tests in 4 languages", body: "Every problem is checked against 10 or more hidden tests, in Python, JavaScript, C++ and Java.", art: "tests" },
  { title: "Study plans", body: "Focused tracks for SQL, system design, HR rounds and CS fundamentals.", art: "plans" },
  { title: "My Prep", body: "Your streak, what you've solved and what to do today, on one page.", art: "prep" },
  { title: "Rooms for interviewers", body: "Run a live coding interview with a shared editor and private test cases.", art: "rooms", soon: true },
] as const;

// Shown when the catalog can't be read, so the section never renders empty.
const FALLBACK_COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Flipkart", "Uber", "Goldman Sachs", "Adobe"].map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), problems: 0 }));

async function topCompanies() {
  try {
    const { companies } = await getCatalog();
    const withLogo = companies.filter((c) => c.problems > 0 && existsSync(join(process.cwd(), "public", "company-icons", `${c.slug}.png`)));
    return withLogo.length >= 4 ? withLogo.slice(0, 8) : FALLBACK_COMPANIES;
  } catch {
    return FALLBACK_COMPANIES;
  }
}

export default async function HomePage() {
  const companies = await topCompanies();
  return (
    <MarketingShell>
      <Hero companies={companies} />

      {/* How it works */}
      <section aria-labelledby="how" className={cn(container, "py-16 md:py-24")}>
        <h2 id="how" className="ag-text-gradient pb-1 font-display text-[40px] leading-none sm:text-[56px]">How it works</h2>
        <div className="mt-12 space-y-20 md:mt-16 md:space-y-32">
          {STEPS.map((s, i) => (
            <div key={s.title} className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
              <Reveal className="md:sticky md:top-28 md:self-start">
                <p className="font-geist-mono text-[13px] text-ag-text-faint">0{i + 1}</p>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight text-ag-text sm:text-[28px]">{s.title}</h3>
                <p className="mt-3 max-w-[420px] text-pretty text-[16px] leading-relaxed text-ag-text-muted">{s.body}</p>
              </Reveal>
              <Reveal delay={100}>{s.demo}</Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* Statement + evidence */}
      <section aria-labelledby="science" className={cn(container, "py-16 md:py-24")}>
        <Reveal>
          <div className={slab}>
            <h2 id="science" className="ag-text-gradient max-w-[760px] text-balance pb-1 font-display text-[38px] leading-[1.02] sm:text-[60px]">Solving a problem isn&rsquo;t the same as remembering how.</h2>
            <p className="mt-5 max-w-[560px] text-pretty text-[16px] leading-relaxed text-ag-text-muted">
              Algogym is built on three of the best-tested findings in learning research.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {EVIDENCE.map((e, i) => (
            <Reveal key={e.title} delay={i * 80}>
              <figure className="h-full rounded-ag-card border border-ag-border bg-ag-surface-1 p-6">
                <h3 className="font-display text-[26px] leading-tight text-ag-text">{e.title}</h3>
                <p className="mt-3 text-pretty text-[15px] leading-relaxed text-ag-text-muted">{e.body}</p>
                <p className="mt-3 text-pretty text-[15px] leading-relaxed text-ag-text">{e.why}</p>
                <figcaption className="mt-5 border-t border-ag-border pt-4 text-[12px] text-ag-text-faint">{e.source}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section aria-labelledby="features" className={cn(container, "py-16 md:py-24")}>
        <h2 id="features" className="ag-text-gradient pb-1 font-display text-[40px] leading-none sm:text-[56px]">Everything for the interview</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 80}>
              <article className="h-full rounded-ag-card border border-ag-border bg-ag-surface-1 p-3">
                <div className="grid h-44 place-items-center rounded-ag-card bg-ag-surface-2"><FeatureArt kind={f.art} /></div>
                <div className="px-3 pb-3 pt-5">
                  <h3 className="flex items-center gap-2 font-display text-[28px] leading-none text-ag-text">{f.title}{"soon" in f && <SoonBadge />}</h3>
                  <p className="mt-2 text-pretty text-[15px] leading-relaxed text-ag-text-muted">{f.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Companies */}
      <section aria-labelledby="companies" className={cn(container, "py-16 md:py-24")}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="companies" className="ag-text-gradient pb-1 font-display text-[40px] leading-none sm:text-[56px]">Practise by company</h2>
          <Link href="/problems" className={cn("rounded-sm text-[15px] text-ag-text-muted hover:text-ag-text", focusRing)}>See all companies ›</Link>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {companies.map((c) => (
            <li key={c.slug}>
              <Link href={`/problems?company=${c.slug}`} className={cn("group flex h-full flex-col gap-4 rounded-ag-card border border-ag-border bg-ag-surface-1 p-4 transition-colors duration-ag-hover hover:border-ag-border-strong hover:bg-ag-surface-2 sm:p-5", focusRing)}>
                <span className="grid size-11 place-items-center overflow-hidden rounded-xl bg-white">
                  <Image src={`/company-icons/${c.slug}.png`} alt="" width={30} height={30} unoptimized className="size-[30px] object-contain" />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold text-ag-text">{c.name}</span>
                  <span className="mt-0.5 block text-[13px] tabular-nums text-ag-text-faint">{c.problems ? `${c.problems.toLocaleString("en-IN")} problems` : "Problems by frequency"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Pricing teaser */}
      <section aria-labelledby="pricing" className={cn(container, "py-16 md:py-24")}>
        <h2 id="pricing" className="ag-text-gradient pb-1 font-display text-[40px] leading-none sm:text-[56px]">Learn free. Upgrade when you&rsquo;re ready.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <PlanCard name="Free" price="₹0" note="Forever" items={["Every lesson and quiz", "The full roadmap", "Free problems with hidden tests", "Company problem lists (all time)"]} cta={<ButtonLink href="/sign-in" variant="secondary">Start free</ButtonLink>} />
          <PlanCard name="Pro" price="₹199" note="a month, or ₹1,499 a year" highlight items={["Everything in Free", "Pro problems, editorials and solutions", "Company lists for the last 30 and 90 days", "Pro study plans"]} cta={<ButtonLink href="/pricing">See pricing</ButtonLink>} />
        </div>
      </section>

      {/* Final CTA */}
      <section className={cn(container, "pb-20 pt-8 md:pb-28")}>
        <Reveal>
          <div className={cn(slab, "flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between")}>
            <p className="ag-text-gradient text-balance pb-1 font-display text-[38px] leading-none sm:text-[56px]">Start preparing today.</p>
            <ButtonLink href="/sign-in">Get started</ButtonLink>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}

function PlanCard({ name, price, note, items, cta, highlight }: { name: string; price: string; note: string; items: string[]; cta: ReactNode; highlight?: boolean }) {
  return (
    <div className={cn("flex flex-col rounded-ag-card border bg-ag-surface-1 p-6 sm:p-8", highlight ? "border-ag-accent" : "border-ag-border")}>
      <p className="text-[14px] text-ag-text-muted">{name}</p>
      <p className="mt-3 font-display text-[56px] leading-none text-ag-text">{price}</p>
      <p className="mt-1 text-[13px] text-ag-text-faint">{note}</p>
      <ul className="mt-6 flex-1 space-y-2.5 border-t border-ag-border pt-6">
        {items.map((it) => <li key={it} className="flex gap-2.5 text-[15px] text-ag-text-muted"><Check className="mt-0.5 size-4 shrink-0 text-ag-text" aria-hidden />{it}</li>)}
      </ul>
      <div className="mt-8">{cta}</div>
    </div>
  );
}

/** Small monochrome illustrations for the feature cards. */
function FeatureArt({ kind }: { kind: (typeof FEATURES)[number]["art"] }) {
  const s = { stroke: "var(--ag-text-faint)", strokeWidth: 1.5, fill: "none" } as const;
  const on = "var(--ag-text)";
  return (
    <svg viewBox="0 0 200 120" className="h-28 w-auto" aria-hidden>
      {kind === "roadmap" && (<><path d="M20 100 L70 70 L50 40 L110 25 L150 55 L180 20" {...s} strokeWidth={3} />{[[20, 100], [70, 70], [50, 40], [110, 25], [150, 55], [180, 20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={8} fill={i < 3 ? on : "var(--ag-surface-3)"} />)}</>)}
      {kind === "company" && [0, 1, 2, 3].map((i) => <g key={i}><rect x={20} y={14 + i * 25} width={22} height={18} rx={5} {...s} /><rect x={52} y={19 + i * 25} width={[120, 90, 70, 45][i]} height={8} rx={4} fill={i === 0 ? on : "var(--ag-surface-3)"} /></g>)}
      {kind === "tests" && [0, 1, 2, 3, 4].map((i) => <g key={i}><circle cx={30} cy={16 + i * 22} r={6} fill={i < 4 ? on : "none"} {...(i < 4 ? {} : s)} /><rect x={46} y={12 + i * 22} width={110 - i * 8} height={8} rx={4} fill="var(--ag-surface-3)" /></g>)}
      {kind === "plans" && [0, 1, 2].map((i) => <rect key={i} x={20 + i * 58} y={20} width={48} height={80} rx={8} {...s} stroke={i === 1 ? on : s.stroke} />)}
      {kind === "prep" && (<><circle cx={60} cy={60} r={34} {...s} strokeWidth={8} stroke="var(--ag-surface-3)" /><path d="M60 26 A34 34 0 1 1 28 72" fill="none" stroke={on} strokeWidth={8} strokeLinecap="round" />{[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={112 + (i % 4) * 18} y={34 + Math.floor(i / 4) * 22} width={12} height={12} rx={3} fill={i < 5 ? on : "var(--ag-surface-3)"} />)}</>)}
      {kind === "rooms" && (<><rect x={20} y={18} width={96} height={84} rx={8} {...s} />{[0, 1, 2, 3].map((i) => <rect key={i} x={30} y={30 + i * 16} width={[60, 44, 70, 30][i]} height={6} rx={3} fill="var(--ag-surface-3)" />)}<circle cx={152} cy={42} r={16} {...s} /><circle cx={152} cy={84} r={16} {...s} stroke={on} /></>)}
    </svg>
  );
}
