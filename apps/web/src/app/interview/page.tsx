import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/shells";
import { ButtonLink } from "@/components/shell/ui";
import { parseFilters } from "@/lib/interview-items";
import { listInterviewItems } from "../../../server/interview-items";
import { InterviewBrowser } from "./interview-browser";

export const metadata: Metadata = {
  title: "Interview prep: HR and SQL questions · Algogym",
  description: "Example HR answers to adapt to your own story, and SQL interview questions with a worked MySQL 8 query for each.",
};

// Content changes only with a migration; refresh hourly.
export const revalidate = 3600;

const accountActions = (
  <ButtonLink href="/sign-in" variant="secondary" size="sm">
    Log in
  </ButtonLink>
);

export default async function InterviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [items, params] = await Promise.all([listInterviewItems(), searchParams]);
  return (
    <AppShell actions={accountActions}>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <header className="max-w-[720px]">
          <h1 className="font-display text-[44px] leading-none text-ag-text sm:text-[56px]">Interview prep</h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ag-text-muted">
            HR questions with an example answer to rework into your own story, and SQL questions with a worked query for
            each. Search, or filter by topic and difficulty.
          </p>
          <p className="mt-3 text-sm text-ag-text-faint">
            Looking for company sheets, role-wise questions or playlists?{" "}
            <Link href="/interview-preparations" className="text-ag-text-muted underline underline-offset-4 hover:text-ag-text">
              They&rsquo;re still in the previous Interview Prep section
            </Link>
            .
          </p>
        </header>
        <InterviewBrowser items={items} initial={parseFilters(params)} />
      </div>
    </AppShell>
  );
}
