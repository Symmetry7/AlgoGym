"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { focusRing, SoonBadge } from "./ui";

export type NavItem = { href: string; label: string; soon?: boolean };

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Desktop links with aria-current on the active route. */
export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname() ?? "";
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-ag-control px-3 font-ui text-sm transition-colors duration-ag-hover ease-ag",
                focusRing,
                active ? "text-ag-text" : "text-ag-text-muted hover:text-ag-text",
              )}
            >
              {item.label}
              {item.soon && <SoonBadge />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Below md: a disclosure menu. Escape closes it and returns focus to the toggle. */
export function MobileMenu({ items, footer }: { items: NavItem[]; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className={cn("inline-flex size-10 items-center justify-center rounded-ag-control text-ag-text hover:bg-ag-surface-2", focusRing)}
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>
      <div id={id} hidden={!open} className="absolute inset-x-0 top-full border-b border-ag-border bg-ag-bg-app px-4 pb-6 pt-2">
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-2 rounded-ag-control px-2 font-ui text-base text-ag-text-muted aria-[current=page]:text-ag-text",
                  focusRing,
                )}
              >
                {item.label}
                {item.soon && <SoonBadge />}
              </Link>
            </li>
          ))}
        </ul>
        {footer && <div className="mt-4 flex flex-col gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Transparent at the top of the page, blurred black once the page scrolls (DESIGN.md §5 Nav). */
const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

export function ScrollHeader({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 8, () => false);
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-ag-panel ease-ag",
        scrolled ? "border-ag-border-strong bg-black" : "border-transparent bg-transparent",
      )}
    >
      {children}
    </header>
  );
}
