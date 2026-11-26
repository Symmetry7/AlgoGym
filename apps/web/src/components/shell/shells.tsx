import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MobileMenu, NavLinks, ScrollHeader, type NavItem } from "./nav";
import { ButtonLink, focusRing, Logo } from "./ui";

// Only routes that exist: a link to a 404 is broken UI, and Next keeps its prefetch open forever.
// Added back by their milestones (docs/BUILD_GUIDE.md): Roadmap (M13), Companies (M12), Arena (M18);
// Interview moved to /interview in M6 (HR and SQL); the rest of the old section stays at /interview-preparations.
export const APP_NAV: NavItem[] = [
  { href: "/problems", label: "Problems" },
  { href: "/interview", label: "Interview" },
  { href: "/pricing", label: "Pricing" },
];

// shortcut: "Features ▾" menu (DESIGN.md §6.1) arrives with the landing page in M16.
export const MARKETING_NAV: NavItem[] = [
  { href: "/problems", label: "Problems" },
  { href: "/pricing", label: "Pricing" },
];

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";

function SkipLink() {
  return (
    <a
      href="#main"
      className={cn(
        "sr-only rounded-ag-control bg-ag-accent px-4 py-2 font-ui text-sm font-semibold text-ag-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50",
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
    <div className="flex min-h-dvh flex-col bg-ag-bg font-ui text-ag-text antialiased">
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
    <div className="flex min-h-dvh flex-col bg-ag-bg-app font-ui text-ag-text antialiased">
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
  // Companies (M12), Arena (M18), Roadmap (M13), Study plans (M15), Credits and Terms (M18) join when built.
  { title: "Product", links: [{ href: "/problems", label: "Problems" }, { href: "/pricing", label: "Pricing" }] },
  { title: "Learn", links: [{ href: "/interview", label: "Interview prep" }] },
  { title: "Company", links: [{ href: "/pricing", label: "For colleges" }] },
  { title: "Legal", links: [{ href: "/privacy", label: "Privacy" }] },
];

export function Footer() {
  return (
    <footer className="border-t border-ag-border">
      <div className={cn(container, "grid grid-cols-2 gap-8 py-12 sm:grid-cols-4")}>
        {FOOTER.map((column) => (
          <div key={column.title}>
            <h2 className="font-ui text-sm font-semibold text-ag-text">{column.title}</h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={cn("rounded-sm font-ui text-sm text-ag-text-muted hover:text-ag-text", focusRing)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className={cn(container, "pb-10 font-ui text-[13px] text-ag-text-faint")}>© {new Date().getFullYear()} Algogym</p>
    </footer>
  );
}
