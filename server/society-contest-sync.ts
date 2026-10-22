import "server-only";
import { adminSupabase } from "./admin";
import { codeforces } from "./providers";

type Contest = { id: string; starts_at: string; ends_at: string; state: string; cf_verified_only: boolean };
type Registration = { user_id: string; cf_handle: string | null };
type SyncState = { next_from: number; complete: boolean; last_synced_at: string | null };

/** A bounded worker invocation. The persisted cursor allows large histories to be scanned over multiple runs. */
export async function syncSocietyContest(contestId: string, maxPages = 4) {
  const db = adminSupabase();
  const { data: contest, error: contestError } = await db.from("society_contests")
    .select("id,starts_at,ends_at,state,cf_verified_only").eq("id", contestId).single<Contest>();
  if (contestError || !contest || contest.state !== "published" || !contest.cf_verified_only)
    throw new Error("A published Codeforces contest is required.");
  if (Date.now() < Date.parse(contest.starts_at)) return { processed: 0, pages: 0, pending: 0 };

  const { data: registrations, error: registrationError } = await db.from("society_contest_registrations")
    .select("user_id,cf_handle").eq("contest_id", contestId).order("registered_at", { ascending: true }).returns<Registration[]>();
  if (registrationError) throw registrationError;
  const { data: states, error: stateError } = await db.from("society_contest_sync_state")
    .select("user_id,next_from,complete,last_synced_at").eq("contest_id", contestId).returns<(SyncState & {user_id:string})[]>();
  if (stateError) throw stateError;
  const byUser = new Map((states ?? []).map(state => [state.user_id, state]));
  let pages = 0, processed = 0, pending = 0;
  for (const registration of registrations ?? []) {
    if (!registration.cf_handle || pages >= maxPages) { pending++; continue; }
    const state = byUser.get(registration.user_id);
    const recentlyCompleted = state?.complete && state.last_synced_at && Date.now() - Date.parse(state.last_synced_at) < 60_000;
    if (recentlyCompleted) continue;
    const from = state?.complete ? 1 : state?.next_from ?? 1;
    // Codeforces returns newest submissions first. Each run does bounded work;
    // every completed pass restarts at page one to catch newly arrived verdicts.
    const submissions = await codeforces("user.status", { handle: registration.cf_handle, from: String(from), count: "200" }, true);
    pages++;
    if (!Array.isArray(submissions)) throw new Error("Codeforces returned an invalid submission page.");
    const earliest = submissions.at(-1)?.creationTimeSeconds;
    const relevant = submissions.filter((submission: any) => {
      const timestamp = submission.creationTimeSeconds * 1000;
      return Number.isInteger(submission.id) && Number.isInteger(submission.problem?.contestId)
        && typeof submission.problem.index === "string"
        && timestamp >= Date.parse(contest.starts_at) && timestamp <= Date.parse(contest.ends_at);
    }).map((submission: any) => ({
      id: String(submission.id), contestId: submission.problem.contestId, index: submission.problem.index,
      submittedAt: new Date(submission.creationTimeSeconds * 1000).toISOString(), verdict: submission.verdict ?? "TESTING",
    }));
    if (relevant.length) {
      const { data: count, error } = await db.rpc("ingest_society_cf_submissions", {
        p_contest: contestId, p_user: registration.user_id, p_handle: registration.cf_handle, p_submissions: relevant,
      });
      if (error) throw error;
      processed += Number(count ?? 0);
    }
    const complete = submissions.length < 200 || (typeof earliest === "number" && earliest * 1000 < Date.parse(contest.starts_at));
    const { error: saveError } = await db.from("society_contest_sync_state").upsert({
      contest_id: contestId, user_id: registration.user_id, next_from: complete ? 1 : from + submissions.length,
      complete, last_synced_at: complete ? new Date().toISOString() : state?.last_synced_at ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "contest_id,user_id" });
    if (saveError) throw saveError;
    if (!complete) pending++;
  }
  return { processed, pages, pending };
}

export async function syncDueSocietyContests() {
  const db = adminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await db.from("society_contests").select("id").eq("state", "published")
    .eq("cf_verified_only", true).lte("starts_at", now).order("starts_at", { ascending: false }).limit(4);
  if (error) throw error;
  const results = [];
  for (const contest of data ?? []) results.push({ contestId: contest.id, ...await syncSocietyContest(contest.id, 3) });
  return results;
}
