"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./ui";

/** Signed-in account control: initials avatar, then a menu with the email, My Prep and Sign out. */
export function AccountMenu({ name, email, avatarUrl }: { name: string; email: string; avatarUrl?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    addEventListener("mousedown", close);
    addEventListener("keydown", close);
    return () => { removeEventListener("mousedown", close); removeEventListener("keydown", close); };
  }, [open]);

  const signOut = async () => {
    setError("");
    const res = await fetch("/api/auth/signout", { method: "POST", credentials: "same-origin" }).catch(() => null);
    if (!res?.ok) { setError("Sign-out failed. Please try again."); return; }
    router.replace("/");
    router.refresh();
  };

  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "A";
  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn("grid size-9 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06] text-[13px] font-semibold text-white transition-colors hover:border-white/30", focusRing)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Google avatar URLs vary by host; a plain img avoids remote-pattern config */}
        {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : initials}
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-white/12 bg-[#0b0b0d] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <div className="px-3 py-2.5">
            <p className="truncate text-[14px] font-medium text-[#f0f0f0]">{name}</p>
            <p className="truncate text-[13px] text-[#a1a4a5]">{email}</p>
          </div>
          <div className="my-1 h-px bg-white/10" />
          <Link role="menuitem" href="/my-prep" onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-[#d4d4d8] hover:bg-white/[0.06] hover:text-white", focusRing)}>
            <User className="size-4" aria-hidden /> My Prep
          </Link>
          <button role="menuitem" type="button" onClick={signOut} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-[#d4d4d8] hover:bg-white/[0.06] hover:text-white", focusRing)}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
          {error && <p role="alert" className="px-3 pb-2 pt-1 text-[12px] text-ag-hard">{error}</p>}
        </div>
      )}
    </div>
  );
}
