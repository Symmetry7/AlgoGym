"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "@/hooks/use-account";
import { SocietyInvitePanel } from "@/components/auth/SocietyInvitePanel";
import type { SocietyDirectory } from "./Societies";
export default function SocietyDetail({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [metric, setMetric] = useState("chakra");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["society-detail", user?.id, slug, page],
    queryFn: () =>
      jsonRequest<SocietyDirectory>(
        `/api/societies?slug=${encodeURIComponent(slug)}&memberOffset=${page * 50}`,
      ),
    retry: 1,
  });
  const society = query.data?.societies[0];
  const own = query.data?.memberships.find(
    (item) => item.society_id === society?.id,
  );
  const ranking = useQuery({
    queryKey: ["society-ranking", society?.id, metric],
    queryFn: () =>
      jsonRequest<{
        entries: Array<{
          rank: number;
          name: string;
          username: string;
          score: number;
        }>;
        methodology: string;
      }>(
        `/api/leaderboards?scope=individual&societyId=${society?.id}&metric=${metric}`,
      ),
    enabled: Boolean(society),
    retry: 1,
  });
  const join = async () => {
    setBusy(true);
    setError("");
    try {
      await jsonRequest("/api/societies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societyId: society?.id }),
      });
      await query.refetch();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Request could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/societies"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <ArrowLeft size={13} />
          All communities
        </Link>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        {query.error ? (
          <p
            role="alert"
            className="rounded-lg border p-7 text-sm text-rose-300"
          >
            {query.error.message}
          </p>
        ) : query.isLoading ? (
          <div
            role="status"
            aria-label="Loading society"
            className="h-96 animate-pulse rounded-lg border bg-card"
          />
        ) : !society ? (
          <p className="rounded-lg border p-8 text-sm text-muted-foreground">
            This society is unavailable or does not exist.
          </p>
        ) : (
          <>
            <header className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {society.colleges?.name}
                </p>
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                  {society.name}
                  
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {society.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {own?.status === "active" && <SocietyInvitePanel societyId={society.id} name={society.name}/>}
                {own?.status === "active" ? (
                  <span className="rounded border px-3 py-2 text-xs text-emerald-400">
                    ✓ Active member
                  </span>
                ) : user ? (
                  <Button size="sm" disabled={busy} onClick={() => void join()}>
                    Join society
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link href="/sign-in">Sign in to join</Link>
                  </Button>
                )}
                {own?.status === "active" &&
                  ["admin", "moderator"].includes(own.role) && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/societies/${slug}/manage`}>
                        Manage members
                      </Link>
                    </Button>
                  )}
              </div>
            </header>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Members", society.summary.members],
                ["Eligible CF members", society.summary.eligible_members],
                [
                  "Average verified CF rating",
                  society.summary.average_cf_rating,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-lg border bg-card p-4"
                >
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="mt-3 text-xl font-semibold tabular-nums">
                    {typeof value === "number"
                      ? Math.round(value).toLocaleString()
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
            <section className="rounded-lg border bg-card p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-medium">Member leaderboard</h2>
                <label>
                  <span className="sr-only">Member ranking metric</span>
                  <select
                    value={metric}
                    onChange={(event) => setMetric(event.target.value)}
                    className="h-9 rounded-md border bg-background px-3 text-xs"
                  >
                    <option value="chakra">Chakra during membership</option>
                    <option value="unique_solves">
                      Verified solves during membership
                    </option>
                    <option value="codeforces_rating">
                      Current Codeforces rating
                    </option>
                    <option value="leetcode_rating">
                      Current LeetCode rating
                    </option>
                  </select>
                </label>
              </div>
              {ranking.error ? (
                <p role="alert" className="text-xs text-rose-300">
                  {ranking.error.message}
                </p>
              ) : ranking.isLoading ? (
                <p role="status" className="text-xs text-muted-foreground">
                  Loading eligible members…
                </p>
              ) : ranking.data?.entries.length ? (
                <ol className="divide-y">
                  {ranking.data.entries.map((entry) => (
                    <li
                      key={entry.rank}
                      className="flex items-center gap-4 py-3 text-xs"
                    >
                      <span className="w-8 font-mono text-muted-foreground">
                        #{entry.rank}
                      </span>
                      <Link
                        href={`/u/${entry.username}`}
                        className="flex-1 hover:text-primary"
                      >
                        {entry.name}
                      </Link>
                      <span className="font-mono">
                        {Number(entry.score).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-8 text-sm text-muted-foreground">
                  No eligible public member data for this metric yet.
                </p>
              )}
              <p className="mt-5 text-[10px] leading-6 text-muted-foreground">
                Only opted-in, metric-eligible verified accounts are ranked.
                Chakra and solve counts here start at current membership;
                platform ratings are kept separate.
              </p>
            </section>
            <section className="rounded-lg border bg-card p-5">
              <h2 className="mb-5 text-sm font-medium">Public members</h2>
              {query.data.members.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {query.data.members.map((member) => (
                    <Link
                      key={member.username}
                      href={`/u/${member.username}`}
                      className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/30"
                    >
                      <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs text-primary">
                        {member.display_name.slice(0, 1)}
                      </span>
                      <div>
                        <p className="text-xs">{member.display_name}</p>
                        <p className="mt-1 text-[10px] capitalize text-muted-foreground">
                          {member.role} · @{member.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Members with public portfolios will appear here.
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={query.data.members.length < 50}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
