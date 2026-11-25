import type { Metadata } from "next";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/shells";
import { Button, ButtonLink, Card, DifficultyChip, Pill, SoonBadge } from "@/components/shell/ui";
import { previewOnly } from "./preview-only";
import { TabsDemo } from "./tabs-demo";

export const metadata: Metadata = { title: "Design system · Algogym", robots: { index: false, follow: false } };

const SWATCHES: [string, string][] = [
  ["bg", "#000000"],
  ["bg-app", "#050506"],
  ["surface-1", "#0B0B0D"],
  ["surface-2", "#121214"],
  ["surface-3", "#1A1A1D"],
  ["text", "#F5F5F7"],
  ["text-muted", "#A1A1AA"],
  ["text-faint", "#84848D"],
  ["accent", "#22C55E"],
  ["accent-hover", "#16A34A"],
  ["on-accent", "#04120A"],
  ["easy", "#22C55E"],
  ["medium", "#F59E0B"],
  ["hard", "#EF4444"],
  ["pro", "#EAB308"],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="border-t border-ag-border py-12">
      <h2 id={id} className="font-ui text-xl font-semibold">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const accountActions = (
  <ButtonLink href="/sign-in" variant="secondary" size="sm">
    Log in
  </ButtonLink>
);

export default function DesignPage() {
  previewOnly();
  return (
    <AppShell actions={accountActions}>
      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-12 sm:px-6">
        <p className="font-ui text-sm text-ag-text-faint">Internal · not indexed</p>
        <h1 className="text-ag-text mt-2 font-display text-[44px] leading-none sm:text-[72px]">Design system</h1>
        <p className="mt-4 max-w-[640px] text-pretty text-base leading-relaxed text-ag-text-muted">
          Tokens, type and primitives from docs/DESIGN.md. Every new page is built from these.
        </p>

        <Section title="Colour">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SWATCHES.map(([name, hex]) => (
              <li key={name} className="overflow-hidden rounded-ag-control border border-ag-border">
                <div className="h-14" style={{ background: `var(--ag-${name})` }} />
                <div className="bg-ag-surface-1 px-3 py-2">
                  <p className="font-geist-mono text-[13px] text-ag-text">--ag-{name}</p>
                  <p className="font-geist-mono text-[13px] text-ag-text-faint">{hex}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Type">
          <div className="space-y-6">
            <p className="text-ag-text font-display text-[52px] leading-none sm:text-[96px]">Interview prep</p>
            <p className="font-display text-[40px] leading-[1.05] sm:text-[56px]">Practice by company</p>
            <p className="text-xl font-semibold leading-snug">Two Pointers · 7 problems</p>
            <p className="max-w-[640px] text-pretty text-base leading-relaxed text-ag-text-muted">
              Given a sorted array, move one pointer from each end towards the middle. Each step discards a value that
              cannot be part of the answer, so the scan is linear.
            </p>
            <p className="text-[13px] text-ag-text-faint">Updated 25 Nov 2026 · 12 min read</p>
            <pre className="overflow-x-auto rounded-ag-control border border-ag-border bg-ag-surface-1 p-4 font-geist-mono text-[13px] leading-relaxed text-ag-text">
              {`function twoSum(nums, target) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo < hi) {\n    const sum = nums[lo] + nums[hi];\n    if (sum === target) return [lo, hi];\n    sum < target ? lo++ : hi--;\n  }\n  return [];\n}`}
            </pre>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Get started</Button>
            <Button variant="secondary">Explore roadmap</Button>
            <Button variant="ghost" arrow>
              Learn more
            </Button>
            <Button size="sm">Submit</Button>
            <Button variant="secondary" size="sm">
              Run
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="text-xl font-semibold">Sliding Window</p>
              <p className="mt-2 text-sm text-ag-text-muted">Layer 2 · Core patterns · 9 problems · 0 solved</p>
            </Card>
            <Card glass>
              <p className="text-xl font-semibold">Glass</p>
              <p className="mt-2 text-sm text-ag-text-muted">Reserved for the hero badge, bento cards and preview frames.</p>
            </Card>
          </div>
        </Section>

        <Section title="Tabs">
          <TabsDemo />
        </Section>

        <Section title="Chips and badges">
          <div className="flex flex-wrap items-center gap-4">
            <Pill>New: Company prep 2026 ›</Pill>
            <SoonBadge />
            <DifficultyChip level="Easy" />
            <DifficultyChip level="Medium" />
            <DifficultyChip level="Hard" />
            <span className="inline-flex items-center gap-1.5 text-sm text-ag-text">
              Merge k Sorted Lists <Lock size={16} className="text-ag-pro" aria-label="Pro" />
            </span>
          </div>
        </Section>

        <Section title="Marketing shell">
          <ButtonLink href="/_design/marketing" variant="ghost" arrow>
            Open the marketing shell preview
          </ButtonLink>
        </Section>
      </div>
    </AppShell>
  );
}
