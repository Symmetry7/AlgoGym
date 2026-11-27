"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClass, focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

/** A side sheet on a native <dialog>: focus is trapped, Esc and the backdrop close it, focus returns to the trigger. */
export function Drawer({ label, title, children, side = "right", triggerClassName, badge }: {
  label: ReactNode;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
  triggerClassName?: string;
  badge?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={cn(buttonClass("secondary", "sm"), "relative", triggerClassName)}>
        {label}
        {badge ? <span className="ml-1 rounded-full bg-ag-accent px-1.5 text-[11px] font-semibold text-ag-on-accent">{badge}</span> : null}
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        className={cn(
          "m-0 h-dvh max-h-dvh w-[min(360px,100vw)] max-w-none border-ag-border bg-ag-surface-1 p-0 text-ag-text backdrop:bg-black/60",
          side === "right" ? "ml-auto border-l" : "mr-auto border-r",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-ag-border px-4">
            <h2 className="font-ui text-base font-semibold">{title}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className={cn("rounded-md p-2 text-ag-text-muted hover:text-ag-text", focusRing)}>
              <X size={18} aria-hidden />
            </button>
          </div>
          {/* Clicking a link inside closes the sheet so the new page isn't hidden behind it. */}
          <div className="flex-1 overflow-y-auto p-4" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>{children}</div>
        </div>
      </dialog>
    </>
  );
}
