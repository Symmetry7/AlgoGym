import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Primitives from docs/DESIGN.md §5. */

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ag-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ag-bg";

const variants: Record<Variant, string> = {
  primary: "bg-ag-accent text-ag-on-accent hover:bg-ag-accent-hover",
  secondary: "border border-ag-border-strong text-ag-text hover:bg-ag-surface-2",
  ghost: "text-ag-text-muted hover:text-ag-text",
};
const sizes: Record<Size, string> = { md: "h-11 px-5 text-[15px]", sm: "h-9 px-3.5 text-sm" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ag-control font-ui font-semibold",
    "transition-colors duration-ag-hover ease-ag disabled:pointer-events-none disabled:opacity-50",
    focusRing,
    variants[variant],
    variant === "ghost" ? "px-1" : sizes[size],
    variant === "ghost" && size === "sm" && "text-sm",
    className,
  );
}

const Arrow = () => (
  <span aria-hidden className="transition-transform duration-ag-hover ease-ag group-hover:translate-x-0.5">
    →
  </span>
);

type Common = { variant?: Variant; size?: Size; arrow?: boolean };

export function Button({ variant, size, arrow, className, children, type = "button", ...props }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({ variant, size, arrow, className, children, href, ...props }: Common & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Card({ glass, className, ...props }: { glass?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-ag-card p-6 shadow-[var(--ag-inset-highlight)]",
        glass ? "ag-glass" : "border border-ag-border bg-ag-surface-1",
        className,
      )}
      {...props}
    />
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("ag-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-ui text-[13px] text-ag-text-muted", className)}>
      {children}
    </span>
  );
}

export function SoonBadge() {
  return (
    <span className="rounded-full bg-ag-accent-soft px-2 py-0.5 font-ui text-[11px] font-medium uppercase tracking-wide text-ag-accent">Soon</span>
  );
}

const difficultyColor = { Easy: "text-ag-easy", Medium: "text-ag-medium", Hard: "text-ag-hard" } as const;

/** Difficulty is always written out, never shown by colour alone (DESIGN.md §7). */
export function DifficultyChip({ level }: { level: keyof typeof difficultyColor }) {
  return <span className={cn("font-ui text-[13px] font-medium", difficultyColor[level])}>{level}</span>;
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("rounded-sm font-display text-[26px] leading-none text-ag-text", focusRing, className)}>
      Algogym
    </Link>
  );
}
