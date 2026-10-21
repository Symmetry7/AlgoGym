"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Library, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings } from "lucide-react";
import { SymmMark } from "@/components/brand/SymmMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
export type SidebarPath = { id: string; title: string; updated_at: string };
export function SymmSidebar({ paths, activeRoute }: { paths: SidebarPath[]; activeRoute: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem("symm-sidebar-collapsed") === "true"); } catch { /* Storage can be disabled. */ }
  }, []);
  const recent = [...paths].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);
  const links = [
    ["/training/symm", "New learning path", Plus],
    ["/training/symm/library?search=1", "Search paths", Search],
    ["/training/symm/library", "Learning library", Library],
    ["/training", "Training Gym", BookOpen],
  ] as const;
  const contents = (compact: boolean) => <>
    <div className="symm-nav-brand"><Link href="/training/symm" aria-label="Symm AI home"><SymmMark className="size-8 rounded-md" />{!compact && <span>Symm AI</span>}</Link></div>
    <nav aria-label="Learning navigation" className="symm-nav-links">
      {links.map(([href, label, Icon]) => <Link key={href} href={href} title={compact ? label : undefined} aria-label={compact ? label : undefined} aria-current={activeRoute === href ? "page" : undefined} onClick={() => setMobileOpen(false)}><Icon size={17} aria-hidden="true" /><span className={compact ? "sr-only" : ""}>{label}</span></Link>)}
    </nav>
    {!compact && <div className="symm-nav-recent"><h2>Recent paths</h2>{recent.length ? <ul>{recent.map((path) => <li key={path.id}><Link href={`/training/symm/${encodeURIComponent(path.id)}`} title={path.title} onClick={() => setMobileOpen(false)}>{path.title}</Link></li>)}</ul> : <p>Your learning paths will appear here.</p>}</div>}
    <div className="symm-nav-account"><Link href="/settings" aria-label="Account settings" title={compact ? "Account settings" : undefined}><Settings size={17} />{!compact && <span>Account settings</span>}</Link><ThemeToggle /></div>
  </>;
  return <>
    <aside className={`symm-product-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <button className="symm-nav-collapse" type="button" aria-label={collapsed ? "Expand learning navigation" : "Collapse learning navigation"} aria-expanded={!collapsed} onClick={() => { const next = !collapsed; setCollapsed(next); try { localStorage.setItem("symm-sidebar-collapsed", String(next)); } catch { /* Preference is optional. */ } }}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>
      {contents(collapsed)}
    </aside>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><button type="button" className="symm-nav-mobile-trigger" aria-label="Open learning navigation"><PanelLeftOpen size={18} /></button></SheetTrigger><SheetContent side="left" className="symm-nav-mobile-panel"><SheetTitle className="sr-only">Symm AI navigation</SheetTitle>{contents(false)}</SheetContent></Sheet>
  </>;
}
