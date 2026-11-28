"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

export interface TopicChip { key: string; label: string; n?: number; href: string; active: boolean }

const chip = "inline-flex h-[30px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 font-ui text-[13px] transition-colors duration-ag-hover ease-ag";

/** Topic pills: one swipeable row on phones; two rows with an Expand toggle from sm up. */
export function TopicChips({ chips }: { chips: TopicChip[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <ul
        aria-label="Topics"
        // Keyboard users tabbing into a hidden row expand the list instead of focusing something invisible.
        onFocus={(e) => { if (!open && (e.target as HTMLElement).offsetTop > 40) setOpen(true); }}
        className={cn(
          "-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto p-0.5 px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0.5 [&::-webkit-scrollbar]:hidden",
          !open && "sm:max-h-[72px] sm:overflow-hidden",
        )}
      >
        {chips.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              scroll={false}
              aria-current={c.active ? "true" : undefined}
              className={cn(chip, focusRing, c.active ? "bg-ag-accent-soft text-ag-accent" : "bg-white/[0.04] text-ag-text-muted hover:bg-white/[0.08] hover:text-ag-text active:bg-white/[0.12]")}
            >
              {c.label}
              {c.n !== undefined && <span className={cn("font-geist-mono text-[11px]", c.active ? "text-ag-accent opacity-80" : "text-ag-text-faint")}>{c.n}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn("mt-0.5 hidden h-[30px] shrink-0 items-center gap-1 rounded-full px-2 font-ui text-[13px] font-medium text-ag-accent hover:text-ag-text active:opacity-70 sm:inline-flex", focusRing)}
      >
        {open ? "Less" : "Expand"}
        <ChevronDown size={14} aria-hidden className={cn("transition-transform duration-ag-hover ease-ag motion-reduce:transition-none", open && "rotate-180")} />
      </button>
    </div>
  );
}
