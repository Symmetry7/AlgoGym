import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/shells";
import { focusRing } from "@/components/shell/ui";
import { LessonBody } from "@/components/system-design/lesson-body";
import { DoneMark } from "@/components/system-design/progress";
import { Quiz } from "@/components/system-design/quiz";
import { Toc } from "@/components/system-design/toc";
import { panel } from "@/components/system-design/ui";
import { cn } from "@/lib/utils";
import { headerActions } from "../../header-actions";
import { getLesson } from "../../lessons";

type Props = { params: Promise<{ slug: string }> };

// Per request: the header reads the session (Supabase).
export const dynamic = "force-dynamic";

const QUIZ = { id: "check-yourself", text: "Check yourself" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = getLesson((await params).slug);
  return found
    ? { title: `${found.lesson.title} · System design · Algogym`, description: found.lesson.summary }
    : { title: "Lesson not found · Algogym" };
}

export default async function SystemDesignLesson({ params }: Props) {
  const { slug } = await params;
  const found = getLesson(slug);
  if (!found) notFound();
  const { lesson, index, total, prev, next } = found;
  const actions = await headerActions(`/system-design/${slug}`);
  const toc = [...lesson.toc, QUIZ];

  return (
    <AppShell actions={actions}>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-8 sm:px-6 md:pt-12">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Link href="/system-design" className={cn("rounded-md text-[13px] text-ag-text-muted hover:text-ag-text active:opacity-80", focusRing)}>
                All lessons
              </Link>
              <div className="mt-8">
                <Toc items={toc} />
              </div>
            </div>
          </aside>

          <article className="min-w-0">
            <header className="max-w-[700px]">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 text-[13px] text-ag-text-faint">
                <Link href="/system-design" className={cn("rounded-md text-ag-text-muted hover:text-ag-text active:opacity-80", focusRing)}>
                  System design
                </Link>
                <span aria-hidden>/</span>
                <span>
                  Lesson {index + 1} of {total}
                </span>
              </nav>
              <h1 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-ag-text [overflow-wrap:break-word] sm:text-[44px]">{lesson.title}</h1>
              <p className="mt-4 text-pretty text-[18px] leading-relaxed text-ag-text-muted">{lesson.summary}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ag-text-faint">
                <span>{lesson.minutes} min read</span>
                <span>{lesson.quiz.length}-question quiz at the end</span>
                <DoneMark slug={lesson.slug} />
              </div>
            </header>

            <details className={cn(panel, "mt-8 max-w-[700px] px-4 py-3 lg:hidden")}>
              <summary className={cn("cursor-pointer rounded-md text-[14px] font-medium text-ag-text active:opacity-80", focusRing)}>On this page</summary>
              <ul className="mt-3 space-y-1.5 pb-1">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className={cn("rounded-md text-[14px] text-ag-text-muted hover:text-ag-text active:opacity-80", focusRing)}>
                      {t.text}
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <div className="mt-10">
              <LessonBody lesson={lesson} />
            </div>

            <section aria-labelledby={QUIZ.id} className="mt-16 max-w-[700px]">
              <h2 id={QUIZ.id} className="scroll-mt-24 text-[24px] font-semibold tracking-[-0.015em] text-ag-text sm:text-[26px]">
                {QUIZ.text}
              </h2>
              <p className="mt-2 text-[15px] text-ag-text-muted">Pick an answer to see why it&rsquo;s right or wrong. Answering all of them marks this lesson done.</p>
              <Quiz slug={lesson.slug} questions={lesson.quiz} />
            </section>

            <nav aria-label="Lessons" className="mt-16 grid max-w-[700px] gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={`/system-design/${prev.slug}`} className={cn(panel, "block p-5 hover:border-ag-border-strong hover:bg-ag-surface-2 active:scale-[0.99]", focusRing)}>
                  <span className="block text-[13px] text-ag-text-faint">Previous lesson</span>
                  <span className="mt-1 block text-[16px] font-semibold text-ag-text">{prev.title}</span>
                </Link>
              ) : (
                <Link href="/system-design" className={cn(panel, "block p-5 hover:border-ag-border-strong hover:bg-ag-surface-2 active:scale-[0.99]", focusRing)}>
                  <span className="block text-[13px] text-ag-text-faint">Back to</span>
                  <span className="mt-1 block text-[16px] font-semibold text-ag-text">All lessons</span>
                </Link>
              )}
              {next ? (
                <Link href={`/system-design/${next.slug}`} className={cn(panel, "block p-5 text-right hover:border-ag-border-strong hover:bg-ag-surface-2 active:scale-[0.99]", focusRing)}>
                  <span className="block text-[13px] text-ag-text-faint">Next lesson</span>
                  <span className="mt-1 block text-[16px] font-semibold text-ag-text">{next.title}</span>
                </Link>
              ) : (
                <Link href="/problems" className={cn(panel, "block p-5 text-right hover:border-ag-border-strong hover:bg-ag-surface-2 active:scale-[0.99]", focusRing)}>
                  <span className="block text-[13px] text-ag-text-faint">You&rsquo;ve finished the track</span>
                  <span className="mt-1 block text-[16px] font-semibold text-ag-text">Practise coding problems</span>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </AppShell>
  );
}
