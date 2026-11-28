import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

/** The track's one solid button: light on black, like the landing's primary actions. */
export const primaryAction = cn(
  "inline-flex h-11 items-center rounded-xl bg-ag-text px-5 text-[15px] font-semibold text-ag-bg hover:opacity-90 active:scale-[0.98]",
  focusRing,
);

/** A lesson card or panel on black: hairline border, 20 px radius. */
export const panel = "rounded-[20px] border border-ag-border bg-ag-surface-1";
