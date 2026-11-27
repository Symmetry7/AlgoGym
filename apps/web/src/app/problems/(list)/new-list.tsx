"use client";

import { Plus } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { Button, focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { createList, type ListState } from "./actions";

export function NewList() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ListState, FormData>(async (prev, form) => {
    const result = await createList(prev, form);
    if (result.ok) setOpen(false);
    return result;
  }, {});
  const id = useId();

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label="New list" className={cn("rounded-md p-1.5 text-ag-text-muted hover:bg-ag-surface-2 hover:text-ag-text", focusRing)}>
        <Plus size={16} aria-hidden />
      </button>
    );
  return (
    <form action={action} className="mt-2 w-full space-y-2">
      <label htmlFor={id} className="sr-only">List name</label>
      <input autoFocus id={id} name="name" maxLength={80} placeholder="List name" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className={cn("h-9 w-full rounded-ag-control border border-ag-border-strong bg-ag-surface-2 px-3 text-sm text-ag-text", focusRing)} />
      {state.error && <p className="text-[13px] text-ag-hard" role="alert">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
