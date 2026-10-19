"use client";
import { useMemo, useRef, useState } from "react";
export function ActivityHeatmap({
  activity,
  days = 365,
  complete = true,
}: {
  activity: Array<{ date: string; count: number }>;
  days?: number;
  complete?: boolean;
}) {
  const cells = useMemo(() => {
    const count = Math.min(days || 365, 365);
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - count + 1);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const values = new Map(activity.map((item) => [item.date, item.count]));
    const result: Array<{ date: string; count: number }> = [];
    for (
      let time = start.getTime();
      time <= end.getTime();
      time += 86_400_000
    ) {
      const date = new Date(time).toISOString().slice(0, 10);
      result.push({ date, count: values.get(date) ?? 0 });
    }
    return result;
  }, [activity, days]);
  const [active, setActive] = useState(-1);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected =
    active < 0 ? cells.length - 1 : Math.min(active, cells.length - 1);
  if (!complete)
    return (
      <div className="flex min-h-32 items-center rounded-md border border-dashed px-5 text-sm leading-6 text-muted-foreground">
        Your verified activity map becomes available after the initial
        Codeforces history sync. LeetCode aggregate counts are excluded.
      </div>
    );
  return (
    <div>
      <div className="overflow-x-auto pb-3">
        <div
          className="grid w-max grid-flow-col grid-rows-7 gap-[3px]"
          role="group"
          aria-label="Daily verified Codeforces solves. Use arrow keys to explore dates."
        >
          {cells.map((cell, index) => (
            <button
              key={cell.date}
              ref={(node) => {
                refs.current[index] = node;
              }}
              tabIndex={selected === index ? 0 : -1}
              aria-label={`${cell.date}: ${cell.count} accepted solve${cell.count === 1 ? "" : "s"}`}
              title={`${cell.date}: ${cell.count} accepted solves`}
              onFocus={() => setActive(index)}
              onKeyDown={(event) => {
                const moves: Record<string, number> = {
                  ArrowRight: 7,
                  ArrowLeft: -7,
                  ArrowDown: 1,
                  ArrowUp: -1,
                };
                if (event.key in moves) {
                  event.preventDefault();
                  const next = Math.max(
                    0,
                    Math.min(cells.length - 1, index + moves[event.key]),
                  );
                  setActive(next);
                  refs.current[next]?.focus();
                }
              }}
              className={`size-[11px] rounded-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white sm:size-3 ${cell.count === 0 ? "bg-[#252A36]" : cell.count < 3 ? "bg-[#443660]" : cell.count < 5 ? "bg-[#6b5198]" : cell.count < 9 ? "bg-[#9271c9]" : "bg-[#b39af5]"}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-3 text-[11px] text-muted-foreground">
        <p aria-live="polite">
          {cells[selected]?.date} · {cells[selected]?.count ?? 0} verified
          solves
        </p>
        <p className="flex items-center gap-1.5">
          Less
          {["#252A36", "#443660", "#6b5198", "#9271c9", "#b39af5"].map(
            (color) => (
              <span
                aria-hidden="true"
                key={color}
                className="size-2.5 rounded-[2px]"
                style={{ background: color }}
              />
            ),
          )}
          More
        </p>
      </div>
    </div>
  );
}
