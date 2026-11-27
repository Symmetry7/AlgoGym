import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getWorkspaceProblem } from "../../../../server/problem-page";
import { Workspace } from "./workspace";

type Props = { params: Promise<{ slug: string }> };

// Render per request: never query Supabase at build time (DECISIONS.md).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getWorkspaceProblem((await params).slug);
  return { title: p ? `${p.title} · Algogym` : "Problem not found · Algogym" };
}

/** The M9 workspace. The statement is rendered here on the server, so markdown never ships to the browser. */
export default async function ProblemWorkspace({ params }: Props) {
  const p = await getWorkspaceProblem((await params).slug);
  if (!p) notFound();
  const statement = (
    <div className="text-[15px] leading-[1.65] text-ag-text [&_code]:rounded [&_code]:bg-ag-surface-2 [&_code]:px-1 [&_code]:font-geist-mono [&_code]:text-[13px] [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_p:first-child]:mt-0 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.statement}</ReactMarkdown>
    </div>
  );
  return (
    <main id="main">
      <Workspace
        statement={statement}
        data={{ slug: p.slug, title: p.title, difficulty: p.difficulty, locked: p.locked, params: p.params, examples: p.examples, hints: p.hints, hasEditorial: p.hasEditorial, starters: p.starters }}
      />
    </main>
  );
}
