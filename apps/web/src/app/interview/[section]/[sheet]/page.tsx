import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/shells";
import { ButtonLink } from "@/components/shell/ui";
import { isSheetSection, SECTION_LABEL } from "@/lib/interview-items";
import { getInterviewSheet } from "../../../../../server/interview-items";
import { SheetQuestions } from "./sheet-questions";

// Render per request, like /interview: no database query at build time (DECISIONS.md 2026-11-27).
export const dynamic = "force-dynamic";

type Params = Promise<{ section: string; sheet: string }>;

async function load(params: Params) {
  const { section, sheet } = await params;
  return isSheetSection(section) ? getInterviewSheet(section, sheet) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Question sheet not found · Algogym" };
  const { sheet } = found;
  return {
    title: `${sheet.title} interview questions · Algogym`,
    description: `${sheet.item_count} ${sheet.title} interview questions (${SECTION_LABEL[sheet.section]}), with an Algogym problem to practise where we have one.`,
  };
}

export default async function SheetPage({ params }: { params: Params }) {
  const found = await load(params);
  if (!found) notFound();
  const { sheet, questions } = found;
  const playable = questions.filter((q) => q.practice).length;
  const answered = questions.filter((q) => q.answer).length;
  return (
    <AppShell actions={<ButtonLink href="/sign-in" variant="secondary" size="sm">Log in</ButtonLink>}>
      <div className="mx-auto w-full max-w-[1000px] px-4 pb-24 pt-8 sm:px-6 md:pt-12">
        <Link href="/interview" className="inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm text-ag-text-muted hover:text-ag-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ag-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ag-bg">
          <ArrowLeft size={16} aria-hidden /> Interview prep
        </Link>
        <header className="mt-4 max-w-[720px]">
          {SECTION_LABEL[sheet.section] !== sheet.title && (
            <p className="mb-2 text-[13px] font-medium text-ag-text-faint">{SECTION_LABEL[sheet.section]}{sheet.group_name ? ` · ${sheet.group_name}` : ""}</p>
          )}
          <h1 className="text-balance font-display text-[36px] leading-[1.05] text-ag-text sm:text-[48px]">{sheet.title}</h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ag-text-muted">
            {questions.length === 1 ? "1 question" : `${questions.length} questions`}
            {playable > 0 && <>, {playable} with an Algogym problem to practise</>}
            {answered > 0 && <>, {answered} with an Algogym answer</>}.
            {playable + answered < questions.length && " The rest are questions to prepare in your own words."}
          </p>
        </header>
        <SheetQuestions questions={questions} />
      </div>
    </AppShell>
  );
}
