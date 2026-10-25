"use client";

import { useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function localValue(date: Date, hour: string, minute: string) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function ContestDateTimeField({ label, value, onChange, hint }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value) : null;
  const selected = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  const hour = value?.slice(11, 13) || "10";
  const minute = value?.slice(14, 16) || "00";
  const update = (date: Date, nextHour = hour, nextMinute = minute) => onChange(localValue(date, nextHour, nextMinute));

  return (
    <div className="min-w-0">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`${label}: ${selected ? selected.toLocaleString() : "Choose date and time"}`} aria-required={label !== "Standings freeze"} className="group flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-background px-3 text-left text-sm transition-colors duration-150 hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            <CalendarDays size={17} className="shrink-0 text-muted-foreground" />
            <span className={selected ? "min-w-0 flex-1 truncate" : "min-w-0 flex-1 truncate text-muted-foreground"}>
              {selected ? selected.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Choose date and time"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-auto max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-popover p-0 shadow-xl">
          <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={date => { if (date) update(date); }} initialFocus className="p-3" />
          <div className="flex items-center gap-2 border-t px-4 py-3">
            <Clock3 size={16} className="text-muted-foreground" />
            <label className="sr-only" htmlFor={`${label.replaceAll(" ", "-")}-hour`}>{label} hour</label>
            <select id={`${label.replaceAll(" ", "-")}-hour`} aria-label={`${label} hour`} value={hour} onChange={event => update(selected ?? new Date(), event.target.value, minute)} className="h-9 rounded-md border bg-background px-2 text-sm tabular-nums">
              {Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0")).map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <span className="text-muted-foreground">:</span>
            <label className="sr-only" htmlFor={`${label.replaceAll(" ", "-")}-minute`}>{label} minute</label>
            <select id={`${label.replaceAll(" ", "-")}-minute`} aria-label={`${label} minute`} value={minute} onChange={event => update(selected ?? new Date(), hour, event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm tabular-nums">
              {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-md px-3 py-2 text-xs font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">Done</button>
          </div>
        </PopoverContent>
      </Popover>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
