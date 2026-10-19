"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  LoaderCircle,
  Plus,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ChakraMark } from "@/components/brand/ChakraMark";
import { Button } from "@/components/ui/button";
import { TrackerFeedback } from "@/components/analytics/TrackerFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { useTracker } from "@/hooks/use-tracker";
import { useStudy } from "@/hooks/use-study";
import { jsonRequest } from "@/hooks/use-account";
import { chakraFor } from "@/lib/training";
import type { Problem } from "@/lib/types";
export default function ProblemDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["problem-detail", id],
    queryFn: () =>
      jsonRequest<Problem>(`/api/problem?id=${encodeURIComponent(id)}`),
    staleTime: 3600000,
    retry: 1,
  });
  const tracker = useTracker(0, "all", false);
  const study = useStudy();
  const [message, setMessage] = useState("");
  const problem = query.data;
  const reward =
    problem?.platform === "codeforces"
      ? chakraFor("codeforces", problem.rating)
      : null;
  const saved = study.data?.questions.some(
    (question) => question.problems?.url === problem?.url,
  );
  const verified = tracker.data?.solvedIds.includes(problem?.id ?? "");
  const save = async () => {
    if (!problem) return;
    try {
      await study.save({ action: "question.add", url: problem.url });
      setMessage("Problem saved to your personal workspace.");
    } catch {
      /* Mutation error is shown below. */
    }
  };
  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/problems">
            <ArrowLeft size={14} />
            All problems
          </Link>
        </Button>
        {query.isLoading ? (
          <div
            role="status"
            aria-label="Loading problem metadata"
            className="h-96 animate-pulse rounded-lg border bg-card"
          />
        ) : query.error ? (
          <div className="rounded-lg border p-8">
            <p role="alert" className="text-sm text-rose-300">
              {query.error.message}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => void query.refetch()}
            >
              Retry problem
            </Button>
          </div>
        ) : problem ? (
          <>
            <header>
              <p className="mb-3 text-xs capitalize text-muted-foreground">
                {problem.platform} ·{" "}
                {problem.id.replace(`${problem.platform}-`, "")}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {problem.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded border px-2.5 py-1.5 text-xs">
                  {problem.difficulty ?? "Unrated"}
                </span>
                {problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </header>
            <section className="space-y-5 rounded-lg border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Accepted-solve verification
                  </p>
                  <p
                    className={`mt-2 text-sm ${verified ? "text-emerald-400" : "text-muted-foreground"}`}
                  >
                    {verified
                      ? "✓ Verified accepted solve"
                      : problem.platform === "leetcode"
                        ? "Per-problem solve proof is unavailable"
                        : !user
                          ? "Sign in and connect Codeforces to track this problem"
                          : tracker.data?.historyComplete
                            ? "Not present in your accepted-solve history"
                            : "Waiting for a complete Codeforces synchronization"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Potential Coins
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-lg text-primary">
                    <ChakraMark className="size-4" variant="small" />
                    {reward ?? "Unavailable"}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-6 text-muted-foreground">
                Read the statement, implement your solution, and submit on the
                source platform. An eligible accepted solve on your
                linked account can earn coins after synchronization, even if you solved it before joining.
                Personal study markers and repeated submissions do not award
                points.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Solve on{" "}
                    {problem.platform === "codeforces"
                      ? "Codeforces"
                      : "LeetCode"}
                    <ExternalLink size={14} />
                  </a>
                </Button>
                {user ? (
                  <Button
                    variant="outline"
                    disabled={study.saving || saved}
                    onClick={() => void save()}
                  >
                    {study.saving ? (
                      <LoaderCircle className="animate-spin" size={14} />
                    ) : saved ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}{" "}
                    {saved ? "Saved to workspace" : "Save to workspace"}
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/sign-in">Sign in to save</Link>
                  </Button>
                )}
              </div>
              {message && (
                <p role="status" className="text-xs text-primary">
                  {message}
                </p>
              )}
              {study.saveError && (
                <p role="alert" className="text-xs text-rose-300">
                  {study.saveError.message}
                </p>
              )}
            </section>
            {user && <TrackerFeedback tracker={tracker} />}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5">
              <div>
                <p className="text-sm">
                  Keep the approach, not just the result.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Saved questions support notes, tags, favorites, and personal
                  study status.
                </p>
              </div>
              <Link
                href={user ? "/workspace" : "/sign-in"}
                className="text-xs text-primary"
              >
                Open your workspace →
              </Link>
            </div>
            {typeof problem.solvedCount === "number" && (
              <p className="text-[11px] text-muted-foreground">
                {problem.solvedCount.toLocaleString()} public Codeforces solves
                · catalog data may be cached for an hour.
              </p>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
