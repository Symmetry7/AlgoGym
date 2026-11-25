import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MobileMenu, NavLinks, ScrollHeader, type NavItem } from "./nav";
import { ButtonLink, focusRing, Logo } from "./ui";

export const APP_NAV: NavItem[] = [
  { href: "/roadmap", label: "Roadmap" },
  { href: "/problems", label: "Problems" },
  { href: "/companies", label: "Companies" },
  { href: "/interview", label: "Interview" },
  { href: "/arena", label: "Arena", soon: true },
  { href: "/pricing", label: "Pricing" },
];

// shortcut: "Features ▾" menu (DESIGN.md §6.1) arrives with the landing page in M16.
export const MARKETING_NAV: NavItem[] = [
  { href: "/companies", label: "Companies" },
  { href: "/pricing", label: "Pricing" },
  { href: "/arena", label: "Arena", soon: true },
];

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";

function SkipLink() {
  return (
    <a
      href="#main"
      className={cn(
        "sr-only rounded-ag-control bg-ag-accent px-4 py-2 font-geist text-sm font-semibold text-ag-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50",
        focusRing,
      )}
    >
      Skip to content
    </a>
  );
}

const authButtons = (
  <>
    <ButtonLink href="/sign-in" variant="secondary" size="sm">
      Log in
    </ButtonLink>
    <ButtonLink href="/sign-in" size="sm">
      Get started
    </ButtonLink>
  </>
);

/** Public pages: transparent nav over the hero, footer below. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ag-bg font-geist text-ag-text antialiased">
      <SkipLink />
      <ScrollHeader>
        <nav aria-label="Main" className={cn(container, "relative flex h-16 items-center justify-between gap-4")}>
          <Logo />
          <NavLinks items={MARKETING_NAV} className="hidden md:flex" />
          <div className="hidden items-center gap-2 md:flex">{authButtons}</div>
          <MobileMenu items={MARKETING_NAV} footer={authButtons} />
        </nav>
      </ScrollHeader>
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/** Signed-in app: solid top nav, content area. `actions` holds the account control. */
export function AppShell({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ag-bg-app font-geist text-ag-text antialiased">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-ag-border bg-ag-bg-app">
        <nav aria-label="Main" className="relative mx-auto flex h-14 w-full max-w-[1440px] items-center gap-6 px-4 sm:px-6">
          <Logo className="text-[22px]" />
          <NavLinks items={APP_NAV} className="hidden md:flex" />
          <div className="ml-auto hidden items-center gap-2 md:flex">{actions}</div>
          <div className="ml-auto md:hidden">
            <MobileMenu items={APP_NAV} footer={actions} />
          </div>
        </nav>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}

const FOOTER: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "Product", links: [{ href: "/problems", label: "Problems" }, { href: "/companies", label: "Companies" }, { href: "/pricing", label: "Pricing" }, { href: "/arena", label: "Arena" }] },
  { title: "Learn", links: [{ href: "/roadmap", label: "Roadmap" }, { href: "/study-plans", label: "Study plans" }, { href: "/interview", label: "Interview prep" }] },
  { title: "Company", links: [{ href: "/pricing#rooms", label: "For colleges" }, { href: "/credits", label: "Credits" }] },
  { title: "Legal", links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }] },
];

export function Footer() {
  return (
    <footer className="border-t border-ag-border">
      <div className={cn(container, "grid grid-cols-2 gap-8 py-12 sm:grid-cols-4")}>
        {FOOTER.map((column) => (
          <div key={column.title}>
            <h2 className="font-geist text-sm font-semibold text-ag-text">{column.title}</h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={cn("rounded-sm font-geist text-sm text-ag-text-muted hover:text-ag-text", focusRing)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className={cn(container, "pb-10 font-geist text-[13px] text-ag-text-faint")}>© {new Date().getFullYear()} Algogym</p>
    </footer>
  );
}
