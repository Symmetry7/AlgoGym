import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DataPanel({
  title,
  href,
  linkLabel,
  children,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "ag-data-panel min-w-0 border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <header className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-normal tracking-tight">{title}</h2>
        {href && (
          <Link
            href={href}
            aria-label={linkLabel ?? `Open ${title}`}
            className="ag-panel-link"
          >
            <ArrowUpRight size={15} />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
