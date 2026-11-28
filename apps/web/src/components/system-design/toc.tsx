"use client";

import { useEffect, useState } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

/** "On this page": the section nearest the top of the viewport is marked as current while you read. */
export function Toc({ items }: { items: { id: string; text: string }[] }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => h !== null);
    // The current section is the last heading above a line a third of the way down the screen.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      setCurrent(headings.filter((h) => h.getBoundingClientRect().top < line).at(-1)?.id ?? null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="text-[13px] font-medium text-ag-text">On this page</p>
      <ul className="mt-3 space-y-0.5 border-l border-ag-border">
        {items.map((item) => {
          const on = current === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-1.5 pl-3.5 pr-2 text-[13px] leading-snug active:opacity-80",
                  focusRing,
                  on ? "border-ag-text text-ag-text" : "border-transparent text-ag-text-faint hover:text-ag-text-muted",
                )}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
