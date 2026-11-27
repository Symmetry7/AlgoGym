import { ArrowLeft, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/components/shell/shells";
import { ButtonLink, DifficultyChip, focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { getProblemPage } from "../../../../server/problem-page";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProblemPage((await params).slug);
  return { title: p ? `${p.title} · Algogym` : "Problem not found · Algogym" };
}

// Render per request: never query Supabase at build time (DECISIONS.md).
export const dynamic = "force-dynamic";

const accountActions = (
  <ButtonLink href="/sign-in" variant="secondary" size="sm">
    Log in
  </ButtonLink>
);
const show = (v: unknown) => JSON.stringify(v);

/**
 * Read-only problem page until the M9 workspace replaces it: statement and examples.
 * Statement markdown is Algogym's own content; react-markdown renders it without raw HTML.
 */
export default async function ProblemPreview({ params }: Props) {
  const p = await getProblemPage((await params).slug);
  if (!p) notFound();
  return (
    <AppShell actions={accountActions}>
      <article className="mx-auto w-full max-w-[760px] px-4 pb-24 pt-8 sm:px-6">
        <Link href="/problems" className={cn("inline-flex items-center gap-1.5 rounded-sm text-sm text-ag-text-muted hover:text-ag-text", focusRing)}>
          <ArrowLeft size={16} aria-hidden /> All problems
        </Link>
        <h1 className="mt-6 font-display text-[40px] leading-[1.05] text-ag-text sm:text-[52px]">{p.title}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ag-text-muted">
          <DifficultyChip level={p.difficulty} />
          {p.tags.map((t) => <span key={t}>{t}</span>)}
          {p.isPro && <span className="inline-flex items-center gap-1 text-ag-pro"><Lock size={14} aria-hidden /> Pro</span>}
        </p>

        <div className="mt-6 rounded-ag-card border border-ag-border bg-ag-surface-1 p-4 text-sm text-ag-text-muted">
          The in-browser editor for this problem is on its way. Until then, read the problem and work through the examples.
        </div>

        <div className="mt-8 text-[15px] leading-[1.65] text-ag-text [&_code]:rounded [&_code]:bg-ag-surface-2 [&_code]:px-1 [&_code]:font-geist-mono [&_code]:text-[13px] [&_h2]:mt-8 [&_h2]:font-ui [&_h2]:text-lg [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.statement}</ReactMarkdown>
        </div>

        {p.locked ? (
          <div className="mt-8 rounded-ag-card border border-ag-border bg-ag-surface-1 p-6 text-center">
            <Lock className="mx-auto text-ag-pro" aria-hidden />
            <p className="mt-3 text-base text-ag-text">The rest of this problem is part of Pro.</p>
            <ButtonLink href="/pricing" className="mt-5">See Pro</ButtonLink>
          </div>
        ) : (
          <section aria-labelledby="examples-h" className="mt-10">
            <h2 id="examples-h" className="font-ui text-lg font-semibold text-ag-text">Examples</h2>
            <ol className="mt-4 space-y-4">
              {p.examples.map((e, i) => (
                <li key={i} className="rounded-ag-card border border-ag-border bg-ag-surface-2 p-4">
                  <p className="text-[13px] font-medium text-ag-text-muted">Example {i + 1}</p>
                  <dl className="mt-2 space-y-1 font-geist-mono text-[13px] text-ag-text">
                    {p.params.map((name, k) => (
                      <div key={name} className="flex gap-2 overflow-x-auto"><dt className="text-ag-text-faint">{name} =</dt><dd className="whitespace-pre">{show(e.input[k])}</dd></div>
                    ))}
                    <div className="flex gap-2 overflow-x-auto"><dt className="text-ag-text-faint">returns</dt><dd className="whitespace-pre">{show(e.output)}</dd></div>
                  </dl>
                  {e.explain && <p className="mt-3 text-sm leading-relaxed text-ag-text-muted">{e.explain}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>
    </AppShell>
  );
}
