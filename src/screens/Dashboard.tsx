"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  Code2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { SiCodeforces, SiLeetcode } from "react-icons/si";
import { Layout } from "@/components/layout/Layout";
import { ChakraMark } from "@/components/brand/ChakraMark";
import { DataPanel } from "@/components/layout/DataPanel";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/hooks/use-account";
import { useStudy } from "@/hooks/use-study";
import { useTracker } from "@/hooks/use-tracker";
import { StudyFeedback } from "@/components/study/StudyFeedback";
import { TrackerFeedback } from "@/components/analytics/TrackerFeedback";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { Distribution } from "@/components/analytics/Charts";

function number(value: unknown) {
  return typeof value === "number" ? Math.round(value).toLocaleString() : "—";
}
export default function Dashboard() {
  const account = useAccount();
  const study = useStudy();
  const tracker = useTracker(0);
  const data = tracker.data;
  const questions = study.data?.questions ?? [];
  const completed = questions.filter(
    (question) => question.study_status === "completed",
  );
  const name = account.data?.profile.display_name?.split(" ")[0] ?? "there";
  const topics = new Map<string, number>();
  for (const question of completed)
    for (const tag of new Set([
      ...(question.problems?.tags ?? []),
      ...question.custom_tags,
    ]))
      topics.set(tag, (topics.get(tag) ?? 0) + 1);
  const cf = data?.snapshots.find(
    (snapshot) => snapshot.provider === "codeforces",
  );
  const lc = data?.snapshots.find(
    (snapshot) => snapshot.provider === "leetcode",
  );
  const sheets =
    study.data?.sheets.filter(
      (sheet) =>
        sheet.created_by === account.data?.profile.id ||
        study.data?.follows.some((follow) => follow.sheet_id === sheet.id) ||
        study.data?.collaborations.some(
          (member) =>
            member.sheet_id === sheet.id && member.status === "accepted",
        ),
    ) ?? [];
  return (
    <Layout>
      <div className="ag-dashboard space-y-4">
        <div className="ag-dashboard-top">
          <header className="ag-dashboard-intro">
            <p className="text-[10px] tracking-[.1em] text-muted-foreground uppercase">
              Your daily practice
            </p>
            <h1>Welcome back, {name}.</h1>
            <p className="mt-3 max-w-sm text-xs leading-6 text-muted-foreground">
              A clearer view of your progress.
              <br />
              Pick up where you left off.
            </p>
            <Link
              href="/workspace"
              className="mt-5 inline-flex items-center gap-2 text-xs"
            >
              <Plus size={14} />
              Open workspace
            </Link>
          </header>
          <Link
            href="/statistics"
            className="ag-highlight-metric ag-highlight-paper"
          >
            <span>
              Total solves
              <ArrowUpRight size={16} />
            </span>
            <strong>{number(data?.overview.totalSolves)}</strong>
            <small>Codeforces history and LeetCode profile</small>
          </Link>
          <Link
          href="/statistics"
            className="ag-highlight-metric ag-highlight-lilac"
          >
            <span>
              Total Coins
              <ChakraMark className="size-4" variant="small" />
            </span>
            <strong>{number(data?.overview.chakra)}</strong>
            <small>Earned through eligible accepted solves</small>
          </Link>
        </div>
        <TrackerFeedback tracker={tracker} />
        <StudyFeedback study={study} />
        <div className="ag-dashboard-grid">
          <DataPanel
            title="My workspace"
            href="/workspace"
            className="ag-dashboard-workspace"
          >
            <div className="ag-study-metrics">
              {[
                ["Saved", questions.length],
                ["Completed", completed.length],
                [
                  "Starred",
                  questions.filter((question) => question.starred).length,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <strong>{study.isLoading ? "—" : value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-b pb-3">
              <h3 className="text-[10px] text-muted-foreground">
                RECENT SHEETS
              </h3>
              <Link
                href="/workspace?tab=sheets"
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            {sheets.length ? (
              sheets.slice(0, 3).map((sheet) => (
                <Link
                  key={sheet.id}
                  href="/workspace?tab=sheets"
                  className="flex items-center justify-between gap-3 border-b py-4 text-xs last:border-0"
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen size={13} className="text-muted-foreground" />
                    {sheet.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {sheet.training_items?.[0]?.count ?? 0} problems
                  </span>
                </Link>
              ))
            ) : (
              <div className="ag-dashboard-empty">
                <BookOpen size={20} />
                <p>No saved sheets yet.</p>
                <Link href="/workspace?tab=explore">
                  Explore community sheets <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </DataPanel>
          <DataPanel
            title="Coding activity"
            href="/statistics"
            className="ag-dashboard-activity"
          >
            <div className="mb-6 flex items-baseline gap-2">
              <strong className="text-[32px] font-normal leading-none tracking-tight">
                {data?.historyComplete
                  ? data.activity.filter((day) => day.count > 0).length
                  : "—"}
              </strong>
              <span className="text-[11px] text-muted-foreground">
                active days in synchronized history
              </span>
            </div>
            <ActivityHeatmap
              activity={data?.activity ?? []}
              complete={data?.historyComplete ?? false}
              days={180}
            />
            <p className="mt-5 text-[10px] text-muted-foreground">
              Verified accepted problems · UTC · Last 180 days
            </p>
          </DataPanel>
          <DataPanel
            title="Study topic distribution"
            href="/notes"
            className="ag-dashboard-topics"
          >
            <Distribution
              items={[...topics]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([label, count]) => ({ label, count }))}
              empty="Complete a question in your workspace to see your study topics."
            />
            <p className="mt-5 text-[10px] leading-5 text-muted-foreground">
              Personal study markers. Server-verified topics are in Statistics.
            </p>
          </DataPanel>
          <DataPanel
            title="Daily revision"
            href="/workspace"
            className="ag-dashboard-revision"
          >
            <span className="ag-dashboard-symbol">
              <BookOpen size={18} />
            </span>
            <p className="mt-5 text-[30px] leading-none tracking-tight">
              {Math.min(completed.length, 20)}
              <span className="ml-1 text-sm text-muted-foreground">/ 20</span>
            </p>
            <p className="mt-3 text-[11px] leading-6 text-muted-foreground">
              {completed.length < 20
                ? "Complete 20 study questions to unlock your revision selection."
                : "Your completed questions are ready for a second pass."}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, (completed.length / 20) * 100)}%`,
                }}
              />
            </div>
            <Link
              href="/workspace"
              className="mt-6 inline-flex items-center gap-2 text-[11px]"
            >
              {completed.length >= 20 ? "Start revision" : "Continue practice"}
              <ArrowRight size={13} />
            </Link>
          </DataPanel>
          <DataPanel
            title="Connected profiles"
            href="/profile"
            className="ag-dashboard-accounts"
          >
            {data?.accounts.length ? (
              <div className="space-y-5">
                {data.accounts.map((profile) => (
                  <div
                    key={profile.platform}
                    className="flex items-center gap-3"
                  >
                    {profile.platform === "codeforces" ? (
                      <SiCodeforces className="size-5 text-primary" />
                    ) : (
                      <SiLeetcode className="size-5 text-[#e7c88e]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs capitalize">{profile.platform}</p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">
                        @{profile.username}
                      </p>
                    </div>
                    <ShieldCheck
                      aria-label="Verified ownership"
                      className="size-4 text-emerald-400"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      CF rating
                    </p>
                    <p className="mt-2 text-xl font-normal">
                      {number(cf?.summary.rating)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      LeetCode solved
                    </p>
                    <p className="mt-2 text-xl font-normal">
                      {number(lc?.summary.totalSolved)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ag-dashboard-empty">
                <Code2 size={21} />
                <p>Bring your progress together.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/onboarding?step=3">Connect profiles</Link>
                </Button>
              </div>
            )}
          </DataPanel>
          <section className="ag-dashboard-training">
            <div>
              <p className="text-[10px] tracking-wide uppercase">
                The training floor
              </p>
              <h2>
                One problem closer
                <br />
                to your next milestone.
              </h2>
              <Link href="/training">
                Resume training
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <span aria-hidden="true" className="ag-training-mark">
              ↗
            </span>
          </section>
          <DataPanel
            title="Recently saved problems"
            href="/workspace"
            className="ag-dashboard-recent"
          >
            {questions.length ? (
              <div className="divide-y">
                {[...questions]
                  .sort(
                    (a, b) =>
                      Date.parse(b.updated_at) - Date.parse(a.updated_at),
                  )
                  .slice(0, 4)
                  .map((question) => (
                    <Link
                      key={question.id}
                      href="/workspace"
                      className="flex items-center justify-between gap-3 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs">
                          {question.problems?.title ?? "Saved question"}
                        </p>
                        <p className="mt-1.5 text-[10px] capitalize text-muted-foreground">
                          {question.problems?.provider ?? "Coding problem"}
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {question.study_status === "completed" && (
                          <Check size={12} />
                        )}{" "}
                        {question.study_status === "completed"
                          ? "Study completed"
                          : "To practice"}
                      </span>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="ag-dashboard-empty">
                <p>Your next problem belongs here.</p>
                <Link href="/problems">
                  Explore problems
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </DataPanel>
          <DataPanel
            title="Contest calendar"
            href="/contests"
            className="ag-dashboard-calendar"
          >
            <CalendarDays
              size={24}
              strokeWidth={1.4}
              className="text-primary"
            />
            <h3 className="mt-5 text-lg font-normal tracking-tight">
              Make time for a round.
            </h3>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              Discover upcoming contests, save the rounds you care about, and
              export a calendar reminder.
            </p>
            <Link
              href="/contests"
              className="mt-6 inline-flex items-center gap-2 text-xs"
            >
              View upcoming contests
              <ArrowRight size={13} />
            </Link>
          </DataPanel>
        </div>
      </div>
    </Layout>
  );
}
