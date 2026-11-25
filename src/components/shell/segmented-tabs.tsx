"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./ui";

export type SegmentOption<T extends string> = { value: T; label: ReactNode; disabled?: boolean };

/** WAI-ARIA tabs with roving tabindex: arrows/Home/End move, Tab leaves the group. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  panelIdPrefix,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** When set, each tab gets aria-controls=`${prefix}-${value}`. */
  panelIdPrefix?: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const pos = enabled.indexOf(index);
    const next = {
      ArrowRight: enabled[(pos + 1) % enabled.length],
      ArrowLeft: enabled[(pos - 1 + enabled.length) % enabled.length],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(options[next].value);
  };

  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex rounded-full bg-ag-surface-2 p-1", className)}>
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={panelIdPrefix ? `${panelIdPrefix}-tab-${option.value}` : undefined}
            aria-selected={selected}
            aria-controls={panelIdPrefix ? `${panelIdPrefix}-${option.value}` : undefined}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 font-ui text-sm font-medium",
              "transition-colors duration-ag-hover ease-ag disabled:cursor-not-allowed disabled:opacity-60",
              focusRing,
              selected ? "bg-ag-surface-3 text-ag-text" : "text-ag-text-muted hover:text-ag-text",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
