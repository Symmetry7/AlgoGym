import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify, textOf, type Lesson } from "@/lib/lessons";
import { ArchDiagram } from "./arch-diagram";

// Rendered on the server, like the problem statement on /problems/[slug]: markdown never ships to the browser.
const components: Components = {
  h2: ({ children }) => (
    <h2 id={slugify(textOf(children))} className="mt-14 scroll-mt-24 text-[24px] font-semibold tracking-[-0.015em] text-ag-text sm:text-[26px]">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="mt-8 text-[18px] font-semibold text-ag-text">{children}</h3>,
  p: ({ children }) => <p className="mt-4 text-pretty">{children}</p>,
  ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-ag-text-faint">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-5 marker:text-ag-text-faint">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-ag-text">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} className="text-ag-text underline decoration-ag-border-strong underline-offset-4 hover:decoration-ag-text">
      {children}
    </a>
  ),
  blockquote: ({ children }) => <blockquote className="mt-6 border-l-2 border-ag-accent pl-4 text-ag-text [&>p]:mt-0">{children}</blockquote>,
  code: ({ children, className }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-md bg-ag-surface-2 px-1.5 py-0.5 font-geist-mono text-[13.5px] text-ag-text">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="mt-5 overflow-x-auto rounded-2xl border border-ag-border bg-ag-surface-1 p-4 font-geist-mono text-[13px] leading-relaxed text-ag-text">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-ag-border">
      <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-ag-border bg-ag-surface-1 px-4 py-2.5 text-[13px] font-medium text-ag-text-muted">{children}</th>,
  td: ({ children }) => <td className="border-b border-ag-border px-4 py-2.5 align-top text-ag-text-muted [tr:last-child_&]:border-b-0">{children}</td>,
};

export function LessonBody({ lesson }: { lesson: Lesson }): ReactNode {
  return (
    <div className="text-[16px] leading-[1.75] text-ag-text-muted">
      {lesson.blocks.map((block, i) =>
        block.kind === "diagram" ? (
          <ArchDiagram key={i} diagram={lesson.diagrams[block.id]} />
        ) : (
          // Prose keeps a reading measure; diagrams take the article's full width.
          <div key={i} className="max-w-[700px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {block.text}
            </ReactMarkdown>
          </div>
        ),
      )}
    </div>
  );
}
