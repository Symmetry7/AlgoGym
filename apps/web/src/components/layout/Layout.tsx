"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Code2,
  Compass,
  Crown,
  GraduationCap,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/hooks/use-account";
import { useBilling } from "@/hooks/use-billing";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
// Legacy layout, kept for the pages that survive M2 until the new app shell replaces them.
const primary = [["/problems", "Problems", Compass]] as const;
const learning = [["/interview", "Interview prep", GraduationCap]] as const;
const headerMetric = "inline-flex h-9 min-w-0 shrink-0 items-center justify-center gap-1 rounded-lg border border-border bg-card px-1.5 text-[11px] font-semibold tabular-nums text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-1.5 sm:rounded-full sm:px-2.5 sm:text-xs";
export function Layout({
  children,
  onOpenHandleModal,
}: {
  children: ReactNode;
  onOpenHandleModal?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const account = useAccount();
  const billing = useBilling();
  const [compact, setCompact] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    setCompact(window.localStorage.getItem("algogym-sidebar-compact") === "true");
  }, []);
  const name =
    account.data?.profile.display_name ||
    user?.user_metadata.full_name ||
    "AlgoGym member";
  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Sign-out failed. Please retry.",
      );
    } finally {
      setSigningOut(false);
    }
  };
  const group = (
    title: string,
    items: ReadonlyArray<readonly [string, string, typeof Code2]>,
    small: boolean,
  ) => (
    <div>
      <p
        className={cn(
          "mb-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground",
          small && "sr-only",
        )}
      >
        {title}
      </p>
      <div className="space-y-1">
        {items.map(([href, label, Icon]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={small ? label : undefined}
              onClick={() => setMobile(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                small && "justify-center px-0",
              )}
            >
              <Icon size={17} strokeWidth={1.7} />
              <span className={small ? "sr-only" : ""}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
  const sidebar = (small: boolean) => (
    <>
      <Link
        href={user ? "/problems" : "/"}
        aria-label="AlgoGym home"
        className="flex h-[68px] shrink-0 items-center justify-center border-b px-4"
      >
        <AlgoGymLogo className={small ? "w-[48px]" : "w-[124px]"} />
      </Link>
      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-7 overflow-y-auto px-3 py-6"
      >
        {group("Workspace", primary, small)}
        {group("Learning", learning, small)}
        {group("Account", [["/settings", "Settings", Settings]], small)}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 flex items-center justify-between rounded-md px-3 py-1 text-xs text-muted-foreground lg:hidden"><span>Appearance</span><ThemeToggle /></div>
        {onOpenHandleModal && <button type="button" onClick={() => {setMobile(false);onOpenHandleModal();}} className="mb-2 flex h-10 w-full items-center rounded-md px-3 text-xs text-muted-foreground hover:bg-muted lg:hidden">Connect profiles</button>}
        {user ? (
          <button
            disabled={signingOut}
            onClick={() => void logout()}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-md px-3 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              small && "justify-center px-0",
            )}
            title={small ? "Sign out" : undefined}
          >
            <LogOut size={16} />
            <span className={small ? "sr-only" : ""}>
              {signingOut ? "Signing out…" : "Sign out"}
            </span>
          </button>
        ) : (
          <Link
            href="/sign-in"
            className="block rounded-md border px-3 py-2 text-center text-xs"
          >
            Sign in
          </Link>
        )}
      </div>
    </>
  );
  return (
    <div className="ag-application min-h-screen bg-background text-foreground">
      <a
        href="#application-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-primary focus:p-3 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          "ag-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-card lg:flex",
          compact ? "w-[72px]" : "w-[232px]",
        )}
      >
        {sidebar(compact)}
      </aside>
      <div className={compact ? "lg:pl-[72px]" : "lg:pl-[232px]"}>
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur sm:gap-3 sm:px-7 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobile} onOpenChange={setMobile}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu size={19} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[260px] flex-col bg-card p-0"
              >
                <SheetTitle className="sr-only">AlgoGym navigation</SheetTitle>
                {sidebar(false)}
              </SheetContent>
            </Sheet>
            <button
              className="hidden rounded p-1.5 text-muted-foreground hover:bg-muted lg:block"
              onClick={() => { const next = !compact; setCompact(next); window.localStorage.setItem("algogym-sidebar-compact", String(next)); }}
              aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            >
              {compact ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {[...primary, ...learning].find(([href]) => href === pathname)?.[1] ??
                (pathname === "/settings" ? "Settings" : "AlgoGym")}
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            {user&&<div className="flex min-w-0 items-center gap-1 sm:gap-2" aria-label="Plan">
              {billing.data?.tier!=="free"&&billing.data?.tier&&<Link href="/pricing" className={cn(headerMetric,"px-1.5 text-[11px] font-bold uppercase tracking-wide",billing.data.tier==="premium"?"sm:border-amber-500/40 sm:bg-amber-500/15 sm:text-amber-700 dark:sm:text-amber-200":"sm:border-violet-500/40 sm:bg-violet-500/15 sm:text-violet-700 dark:sm:text-violet-200")} aria-label={`${billing.data.tier} plan`}>{billing.data.tier==="premium"?<Crown size={14} className="text-amber-500"/>:<Sparkles size={14} className="text-violet-500"/>}<span className="hidden sm:inline">{billing.data.tier}</span></Link>}
            </div>}
            <div className="hidden sm:block"><ThemeToggle /></div>
            {onOpenHandleModal && (
              <Button variant="outline" size="sm" onClick={onOpenHandleModal} className="hidden sm:inline-flex">
                Connect profiles
              </Button>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-auto sm:gap-2 sm:py-1 sm:pl-1 sm:pr-2"
                    aria-label="Open account menu"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden max-w-36 truncate text-xs sm:block">
                      {name}
                    </span>
                    <ChevronDown size={12} className="hidden text-muted-foreground sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[["/settings", "Settings", Settings]].map(([href, label, Icon]) => {
                    const Mark = Icon as typeof Code2;
                    return (
                      <DropdownMenuItem asChild key={String(href)}>
                        <Link href={String(href)} className="gap-2">
                          <Mark size={14} />
                          {String(label)}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={signingOut}
                    onSelect={() => void logout()}
                    className="gap-2"
                  >
                    <LogOut size={14} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
        </header>
        <main
          id="application-main"
          className="mx-auto w-full max-w-[1480px] px-4 py-7 sm:px-7 lg:px-8"
        >
          {children}
        </main>
        <footer className="border-t px-4 py-5 text-center text-[11px] text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <span className="mx-2">·</span>AlgoGym
        </footer>
      </div>
    </div>
  );
}
