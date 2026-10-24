"use client";
import { useEffect, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Code2,
  Compass,
  Crown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  Trophy,
  Users,
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
import { CoinMark } from "@/components/brand/ChakraMark";
import { SymmMark } from "@/components/brand/SymmMark";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
const primary = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/problems", "Problems", Compass],
  ["/upsolve", "Upsolve", RefreshCw],
  ["/workspace", "My Workspace", BookOpen],
  ["/notes", "My Notes", FileText],
  ["/statistics", "Statistics", Activity],
  ["/contests", "Contests", CalendarDays],
] as const;
const learning = [
  ["/training/symm", "Symm AI", BookOpen],
  ["/training", "Training Gym", GraduationCap],
  ["/resources", "Resources", FileText],
] as const;
const community = [
  ["/leaderboards", "Leaderboards", Trophy],
  ["/societies", "Communities", Users],
] as const;
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
  const [hovered, setHovered] = useState(false);
  const [width, setWidth] = useState(232);
  const [mobile, setMobile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    setCompact(window.localStorage.getItem("algogym-sidebar-compact") === "true");
    const saved = Number(window.localStorage.getItem("algogym-sidebar-width"));
if (saved >= 200 && saved <= 480) setWidth(saved);
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

  const startResize = (e: ReactPointerEvent) => {
  e.preventDefault();
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
  let latest = width;
  const move = (ev: PointerEvent) => {
    latest = Math.min(480, Math.max(200, ev.clientX));
    setWidth(latest);
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.localStorage.setItem("algogym-sidebar-width", String(latest));
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
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
          const active =
            href === "/workspace"
              ? pathname === "/workspace" || pathname === "/sheets"
              : href === "/training"
                ? pathname === "/training"
              : pathname === href || pathname.startsWith(`${href}/`);
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
                  ? href === "/training/symm" ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" : "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                href === "/training/symm" && !active && "font-medium text-foreground",
                small && "justify-center px-0",
              )}
            >
              {href === "/training/symm" ? <SymmMark className="size-[19px] rounded object-contain" /> : <Icon size={17} strokeWidth={1.7} />}
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
        href={user ? "/dashboard" : "/"}
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
        {group("Community", community, small)}
        {group(
          "Account",
          [
            ["/profile", "Coding portfolio", Code2],
            ["/settings", "Settings", Settings],
          ],
          small,
        )}
      </nav>
      <div className="border-t p-3">
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
   <div
  className="ag-application min-h-screen bg-background text-foreground"
  style={{ "--sidebar-w": `${compact ? 72 : width}px` } as React.CSSProperties}
>
      <a
        href="#application-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-primary focus:p-3 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <aside
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{ width: compact && !hovered ? 72 : width }}
  className={cn(
    "ag-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-card transition-[width] duration-200 lg:flex",
    compact && hovered && "shadow-xl",
  )}
>
  {sidebar(compact && !hovered)}
  {!compact && (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      onPointerDown={startResize}
      className="absolute inset-y-0 -right-1 z-40 w-2 cursor-col-resize transition-colors hover:bg-primary/30"
    />
  )}
</aside>
      <div className="lg:pl-[var(--sidebar-w)]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-7 lg:px-8">
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
            <p className="truncate text-xs text-muted-foreground">
              {[...primary, ...learning, ...community].find(
                ([href]) => href === pathname,
              )?.[1] ??
                (pathname === "/profile"
                  ? "Coding portfolio"
                  : pathname === "/settings"
                    ? "Settings"
                    : "AlgoGym")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user&&<div className="flex items-center gap-1.5 sm:gap-2" aria-label="Account balances">
              {billing.data?.tier!=="free"&&billing.data?.tier&&<Link href="/pricing" className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide",billing.data.tier==="premium"?"border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-200":"border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-200")}>{billing.data.tier==="premium"?<Crown size={13}/>:<Sparkles size={13}/>}<span className="hidden sm:inline">{billing.data.tier}</span></Link>}
              <Link href="/statistics" className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-200" title="Gold coins earned from verified solves"><CoinMark className="size-[18px] object-contain" />{billing.data?.coins??"—"}</Link>
              <Link href="/training/symm" className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-200" title="AI learning path credits"><Sparkles size={14}/>{billing.data?.credits?.available??"—"}</Link>
            </div>}
            <ThemeToggle />
            {onOpenHandleModal && (
              <Button variant="outline" size="sm" onClick={onOpenHandleModal}>
                Connect profiles
              </Button>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Open account menu"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden max-w-36 truncate text-xs sm:block">
                      {name}
                    </span>
                    <ChevronDown size={12} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    ["/profile", "Profile", Code2],
                    ["/settings", "Edit profile", Settings],
                    ["/profile/card", "Profile card", Share2],
                    ["/workspace?tab=sheets", "My sheets", BookOpen],
                  ].map(([href, label, Icon]) => {
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
