import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/shells";
import { ButtonLink } from "@/components/shell/ui";
import { parseFilters } from "@/lib/interview-items";
import { listInterviewItems, listInterviewSheets } from "../../../../server/interview-items";
import { InterviewBrowser } from "../interview-browser";
import { SheetIndex } from "../sheet-index";

export const metadata: Metadata = {
  title: "Interview prep: company, role, HR and SQL questions · Algogym",
  description: "Company-wise DSA sheets, role and topic question lists, example HR answers to adapt to your own story, and SQL questions with a worked MySQL 8 query for each.",
};

// Render per request: the build has no database (CI) and preview/production databases may not
// have interview_items yet, so the page must never query Supabase at build time. error.tsx
// covers a failed load at request time.
export const dynamic = "force-dynamic";

const accountActions = (
  <ButtonLink href="/sign-in" variant="secondary" size="sm">
    Log in
  </ButtonLink>
);

export default async function InterviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [items, sheets, params] = await Promise.all([listInterviewItems(), listInterviewSheets(), searchParams]);
  return (
    <AppShell actions={accountActions}>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <header className="max-w-[720px]">
          <h1 className="font-display text-[44px] leading-none text-ag-text sm:text-[56px]">Interview prep</h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ag-text-muted">
            Company, role and topic question sheets, HR questions with an example answer to rework into your own story, and SQL
            questions with a worked query for each.
          </p>
          <p className="mt-3 text-sm text-ag-text-faint">
            Looking for the video playlists?{" "}
            <Link href="/interview-preparations" className="text-ag-text-muted underline underline-offset-4 hover:text-ag-text">
              They&rsquo;re still in the previous Interview Prep section
            </Link>
            .
          </p>
        </header>
        <SheetIndex sheets={sheets} />
        <h2 id="answers" className="mt-14 scroll-mt-20 font-ui text-xl font-semibold text-ag-text">Questions with Algogym answers</h2>
        <InterviewBrowser items={items} initial={parseFilters(params)} />
      </div>
    </AppShell>
  );
}
