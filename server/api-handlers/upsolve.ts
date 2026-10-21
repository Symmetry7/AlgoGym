import { serverSupabase, type ApiRequest, type ApiResponse } from "../supabase";
import { groupUpsolveAttempts, pendingUpsolves, type UpsolveSubmission } from "../../src/lib/upsolve";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Sign in to view your upsolve queue." });

    // Provider evidence is owned by the signed-in user and protected by RLS.
    // This window keeps the response bounded; the UI names it a recent queue.
    const [submissionResult, snapshotResult] = await Promise.all([
      client.from("provider_submissions")
        .select("problem_id,verdict,submitted_at,contest_id,problems(id,title,url,cf_rating,tags)")
        .eq("user_id", user.id).eq("provider", "codeforces")
        .neq("verdict", "OK")
        .order("submitted_at", { ascending: false }).limit(1000),
      client.from("provider_snapshots")
        .select("submissions_complete,last_synced_at")
        .eq("user_id", user.id).eq("provider", "codeforces").maybeSingle(),
    ]);
    if (submissionResult.error) throw submissionResult.error;
    if (snapshotResult.error) throw snapshotResult.error;
    const attempts = groupUpsolveAttempts((submissionResult.data ?? []) as unknown as UpsolveSubmission[]);
    const ids = [...attempts.keys()];
    const solved = new Set<string>();
    for (let offset = 0; offset < ids.length; offset += 80) {
      const batch = await client.from("solves")
        .select("problem_id").eq("user_id", user.id)
        .in("problem_id", ids.slice(offset, offset + 80));
      if (batch.error) throw batch.error;
      for (const item of batch.data ?? []) solved.add(item.problem_id);
    }
    return res.status(200).json({
      problems: pendingUpsolves(attempts, solved),
      scannedSubmissions: submissionResult.data?.length ?? 0,
      historyComplete: snapshotResult.data?.submissions_complete ?? false,
      lastSyncedAt: snapshotResult.data?.last_synced_at ?? null,
    });
  } catch {
    return res.status(503).json({ error: "Your upsolve queue is temporarily unavailable. Please retry." });
  } finally {
    flushCookies();
  }
}
