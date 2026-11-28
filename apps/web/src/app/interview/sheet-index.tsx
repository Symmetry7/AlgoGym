import Link from "next/link";
import { focusRing } from "@/components/shell/ui";
import { groupSheets, type InterviewSheet } from "@/lib/interview-items";
import { cn } from "@/lib/utils";

/** Every question sheet, by section. Sections with groups (roles, topics) list each group on its own line. */
export function SheetIndex({ sheets }: { sheets: InterviewSheet[] }) {
  const sections = groupSheets(sheets);
  if (!sections.length) return null;
  return (
    <section aria-labelledby="sheets-heading" className="mt-12">
      <h2 id="sheets-heading" className="font-ui text-xl font-semibold text-ag-text">Question sheets</h2>
      <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-ag-text-muted">
        Company, role and topic question lists. Coding questions open the Algogym problem that practises the same idea, where we have one.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map(({ section, label, sheets: list }) => {
          const groups = [...new Set(list.map((s) => s.group_name))];
          return (
            <div key={section} className="min-w-0 rounded-ag-card border border-ag-border bg-ag-surface-1 p-4 sm:p-5">
              <h3 className="font-ui text-[15px] font-semibold text-ag-text">
                {label} <span className="font-normal text-ag-text-faint">{list.length}</span>
              </h3>
              {groups.map((group) => (
                <div key={group ?? "all"} className="mt-3">
                  {group && <p className="mb-2 text-[13px] text-ag-text-faint">{group}</p>}
                  <ul className="flex flex-wrap gap-2">
                    {list.filter((s) => s.group_name === group).map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/interview/${s.section}/${s.slug}`}
                          className={cn(
                            "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ag-border bg-ag-surface-2 px-3 text-[13px] text-ag-text",
                            "transition-colors duration-ag-hover ease-ag hover:border-ag-border-strong hover:bg-ag-surface-3",
                            focusRing,
                          )}
                        >
                          {s.title}
                          <span className="text-ag-text-faint">{s.item_count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
