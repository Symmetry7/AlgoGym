"use client";

import { useState } from "react";
import { SegmentedTabs } from "@/components/shell/segmented-tabs";

const TRACKS = [
  { value: "dsa", label: "DSA" },
  { value: "patterns", label: "Patterns" },
  { value: "sql", label: "SQL" },
  { value: "hr", label: "HR" },
  { value: "system-design", label: "System Design", disabled: true },
] as const;

const COPY: Record<string, string> = {
  dsa: "Arrays, hashing, two pointers and 10 more topics, in order.",
  patterns: "16 patterns that cover most interview problems.",
  sql: "Joins, window functions and aggregation, with worked answers.",
  hr: "Behavioural questions with structured model answers.",
};

export function TabsDemo() {
  const [track, setTrack] = useState<string>("dsa");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SegmentedTabs label="Learning track" options={[...TRACKS]} value={track} onChange={setTrack} panelIdPrefix="track" />
        <p id={`track-${track}`} role="tabpanel" aria-labelledby={`track-tab-${track}`} className="mt-3 font-ui text-sm text-ag-text-muted">
          {COPY[track]}
        </p>
      </div>
      <SegmentedTabs<"monthly" | "yearly">
        label="Billing period"
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "yearly", label: "Yearly · save 37%" },
        ]}
        value={billing}
        onChange={setBilling}
      />
    </div>
  );
}
