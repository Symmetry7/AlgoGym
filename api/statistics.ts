import {
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";
export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader("Cache-Control", "private, no-store");
  if (request.method !== "GET")
    return response.status(405).json({ error: "Method not allowed." });
  const { client, flushCookies } = serverSupabase(request, response);
  try {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user)
      return response
        .status(401)
        .json({ error: "Sign in to view your Codeforces record." });
    const [account, snapshot, ratings] = await Promise.all([
      client
        .from("coding_profiles")
        .select("username")
        .eq("user_id", user.id)
        .eq("platform", "codeforces")
        .maybeSingle(),
      client
        .from("provider_snapshots")
        .select("submissions_complete,last_synced_at")
        .eq("user_id", user.id)
        .eq("provider", "codeforces")
        .maybeSingle(),
      client
        .from("provider_rating_history")
        .select(
          "contest_id,contest_name,contest_rank,contest_at,rating_before,rating_after",
        )
        .eq("user_id", user.id)
        .eq("provider", "codeforces")
        .order("contest_at")
        .limit(10000),
    ]);
    if (account.error || snapshot.error || ratings.error)
      throw new Error("Unavailable");
    const rows: any[] = [];
    let complete = false;
    for (let offset = 0; offset < 100000; offset += 1000) {
      const { data, error } = await client
        .from("provider_submissions")
        .select(
          "provider_submission_id,verdict,language,runtime_ms,memory_bytes,contest_id,relative_time_seconds,participant_type,submitted_at,problems(external_problem_id,title,url,cf_rating,tags)",
        )
        .eq("user_id", user.id)
        .eq("provider", "codeforces")
        .order("submitted_at", { ascending: false })
        .order("id")
        .range(offset, offset + 999);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 1000) {
        complete = true;
        break;
      }
    }
    if (!complete) throw new Error("Archive too large");
    return response
      .status(200)
      .json({
        handle: account.data?.username ?? null,
        complete: snapshot.data?.submissions_complete ?? false,
        lastSyncedAt: snapshot.data?.last_synced_at ?? null,
        submissions: rows
          .filter((row) => row.problems)
          .map((row) => ({
            id: row.provider_submission_id,
            problemId: row.problems.external_problem_id,
            title: row.problems.title,
            index: row.problems.external_problem_id.split(":")[1],
            contestId: row.contest_id,
            rating: row.problems.cf_rating,
            tags: row.problems.tags ?? [],
            verdict: row.verdict,
            language: row.language,
            runtime: row.runtime_ms,
            memory: row.memory_bytes,
            date: row.submitted_at,
            relativeSeconds: row.relative_time_seconds,
            participantType: row.participant_type,
            url: row.problems.url,
          })),
        ratings: (ratings.data ?? []).map((row) => ({
          contestId: row.contest_id,
          name: row.contest_name ?? `Contest ${row.contest_id}`,
          rank: row.contest_rank,
          date: row.contest_at,
          before: row.rating_before,
          rating: row.rating_after,
        })),
      });
  } catch {
    return response
      .status(503)
      .json({
        error:
          "The Codeforces archive could not be loaded. Your saved records are preserved; retry shortly.",
      });
  } finally {
    flushCookies();
  }
}
