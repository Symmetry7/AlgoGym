import type { SupabaseClient } from "@supabase/supabase-js";
import {
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";
import { aggregateActivity } from "../analytics";
import type { LedgerEntry, TrackedSolve } from "../../src/lib/tracker-types";
async function allRows(
  client: SupabaseClient,
  table: string,
  select: string,
  userId: string,
) {
  const rows: any[] = [];
  for (let offset = 0; offset < 100_000; offset += 1000) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .eq("user_id", userId)
      .order("id")
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
  throw new Error("The activity archive needs a paginated aggregation job.");
}
export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader("Cache-Control", "private, no-store");
  if (request.method !== "GET")
    return response.status(405).json({ error: "Method not allowed." });
  const params = new URL(request.url ?? "/", "http://localhost").searchParams;
  const days = Number(params.get("days") ?? 365);
  const provider = params.get("provider") ?? "all";
  if (
    ![0, 7, 30, 90, 365].includes(days) ||
    !["all", "codeforces", "leetcode"].includes(provider)
  )
    return response
      .status(400)
      .json({ error: "Choose a supported platform and date range." });
  const { client, flushCookies } = serverSupabase(request, response);
  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user)
      return response
        .status(401)
        .json({ error: "Sign in to view your coding activity." });
    const [
      accountResult,
      snapshotResult,
      jobResult,
      solves,
      ledger,
      ratingResult,
    ] = await Promise.all([
      client
        .from("coding_profiles")
        .select("platform,username,verified_at")
        .eq("user_id", user.id),
      client
        .from("provider_snapshots")
        .select(
          "provider,profile,summary,history_complete,last_synced_at,updated_at",
        )
        .eq("user_id", user.id),
      client
        .from("sync_jobs")
        .select("id,provider,status,error_code,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
      allRows(
        client,
        "solves",
        "id,problem_id,first_accepted_at,proof_status,problems(provider,external_problem_id,title,url,cf_rating,lc_difficulty,tags)",
        user.id,
      ),
      allRows(
        client,
        "chakra_ledger",
        "id,delta,created_at,chakra_awards(problem_id,difficulty_snapshot,problems(provider,cf_rating,lc_difficulty))",
        user.id,
      ),
      client
        .from("provider_rating_history")
        .select("provider,contest_id,contest_name,contest_rank,contest_at,rating_before,rating_after")
        .eq("user_id", user.id)
        .order("contest_at")
        .limit(10_000),
    ]);
    if (
      accountResult.error ||
      snapshotResult.error ||
      jobResult.error ||
      ratingResult.error
    )
      throw new Error("Activity data is unavailable.");
    const rewards = new Map<string, number>();
    for (const entry of ledger) {
      const key = entry.chakra_awards?.problem_id;
      if (key) rewards.set(key, (rewards.get(key) ?? 0) + Number(entry.delta));
    }
    const normalized: TrackedSolve[] = solves
      .filter((item) => item.proof_status === "verified" && item.problems)
      .map((item) => {
        const problem = item.problems;
        return {
          id:
            problem.provider === "codeforces"
              ? `codeforces-${problem.external_problem_id.replace(":", "")}`
              : `leetcode-${problem.external_problem_id}`,
          problemId: item.problem_id,
          title: problem.title,
          provider: problem.provider,
          rating: problem.cf_rating,
          difficulty: problem.lc_difficulty,
          tags: problem.tags ?? [],
          url: problem.url,
          acceptedAt: item.first_accepted_at,
          chakra: rewards.get(item.problem_id) ?? null,
        };
      });
    const entries: LedgerEntry[] = ledger.map((item) => ({
      id: item.id,
      delta: Number(item.delta),
      createdAt: item.created_at,
      provider: item.chakra_awards?.problems?.provider ?? null,
      difficulty:
        item.chakra_awards?.difficulty_snapshot?.rating?.toString() ??
        item.chakra_awards?.difficulty_snapshot?.difficulty ??
        null,
    }));
    const historyComplete =
      (accountResult.data ?? []).some(
        (account) => account.platform === "codeforces",
      ) &&
      (snapshotResult.data ?? []).some(
        (snapshot) =>
          snapshot.provider === "codeforces" && snapshot.history_complete,
      );
    const aggregation = aggregateActivity(
      normalized,
      entries,
      days,
      provider,
      historyComplete,
    );
    return response
      .status(200)
      .json({
        accounts: accountResult.data ?? [],
        snapshots: snapshotResult.data ?? [],
        jobs: jobResult.data ?? [],
        historyComplete,
        days,
        provider,
        solvedIds: normalized.map((item) => item.id),
        solves: normalized,
        ...aggregation,
        overview: {
          ...aggregation.overview,
          totalSolves:
            normalized.filter((item) => item.provider === "codeforces").length +
            Number((snapshotResult.data ?? []).find((item) => item.provider === "leetcode")?.summary?.totalSolved ?? 0),
        },
        ratingHistory: (ratingResult.data ?? [])
          .map((item) => ({
            provider: item.provider,
            date: item.contest_at,
            contestId: item.contest_id,
            contestName: item.contest_name,
            contestRank: item.contest_rank,
            before: item.rating_before,
            rating: item.rating_after,
          })),
        ledger: entries,
      });
  } catch {
    return response
      .status(503)
      .json({
        error:
          "Your coding activity could not be loaded. Your last saved records are preserved; please retry.",
      });
  } finally {
    flushCookies();
  }
}
