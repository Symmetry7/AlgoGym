"use client";

import { useEffect, useState } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

/** "On this page": the section nearest the top of the viewport is marked as current while you read. */
export function Toc({ items }: { items: { id: string; text: string }[] }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => h !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setCurrent(top.target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
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
                  "-ml-px block rounded-r-md border-l py-1.5 pl-3.5 pr-2 text-[13px] leading-snug active:opacity-80",
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
