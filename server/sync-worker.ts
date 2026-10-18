import "server-only";
import { adminSupabase } from "./admin";
import { codeforces, leetcodeProfile, ProviderError } from "./providers";

export async function processSyncJobs(maxPages = 2) {
  const db = adminSupabase();
  let processed = 0;
  for (let page = 0; page < maxPages; page++) {
    const { data: jobs, error: leaseError } = await db.rpc("lease_sync_job");
    if (leaseError)
      throw new Error("The synchronization queue could not be leased.");
    const job = jobs?.[0];
    if (!job) break;
    const update = async (value: Record<string, unknown>) => {
      const { error } = await db
        .from("sync_jobs")
        .update({ ...value, updated_at: new Date().toISOString() })
        .eq("id", job.id)
        .eq("lease_token", job.lease_token);
      if (error)
        throw new Error("The synchronization checkpoint could not be saved.");
    };
    try {
      const { data: account, error: accountError } = await db
        .from("coding_profiles")
        .select("username")
        .eq("user_id", job.user_id)
        .eq("platform", job.provider)
        .single();
      if (accountError || !account)
        throw new ProviderError(
          "The verified coding profile is unavailable.",
          "account_unavailable",
        );
      if (job.provider === "leetcode") {
        const data = await leetcodeProfile(account.username);
        if (
          data.profile.username.toLowerCase() !== account.username.toLowerCase()
        )
          throw new ProviderError(
            "The public profile did not match the linked account.",
            "account_mismatch",
          );
        const { error } = await db
          .from("provider_snapshots")
          .upsert({
            user_id: job.user_id,
            provider: "leetcode",
            profile: data.profile,
            summary: data.summary,
            history_complete: false,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
        if (data.ratings.length) {
          const { error: ratingError } = await db
            .from("provider_rating_history")
            .upsert(
              data.ratings.map((item: any) => ({
                user_id: job.user_id,
                provider: "leetcode",
                contest_id: String(item.contest.startTime),
                contest_at: new Date(
                  item.contest.startTime * 1000,
                ).toISOString(),
                rating_after: Math.round(item.rating),
                rating_before: null,
              })),
              { onConflict: "user_id,provider,contest_id" },
            );
          if (ratingError) throw ratingError;
        }
        await update({
          status: "succeeded",
          leased_until: null,
          error_code: null,
        });
        processed++;
        continue;
      }
      const cursor = job.cursor ?? {};
      const from = Number(cursor.from ?? 1);
      const pageSize = 1000;
      if (from === 1) {
        const [info] = await codeforces(
          "user.info",
          { handles: account.username },
          true,
        );
        if (
          !info ||
          info.handle?.toLowerCase() !== account.username.toLowerCase()
        )
          throw new ProviderError(
            "The public profile did not match the linked account.",
            "account_mismatch",
          );
        const ratings = await codeforces(
          "user.rating",
          { handle: account.username },
          true,
        );
        const { data: previous } = await db
          .from("provider_snapshots")
          .select("history_complete,last_synced_at,submissions_complete")
          .eq("user_id", job.user_id)
          .eq("provider", "codeforces")
          .maybeSingle();
        const { error } = await db
          .from("provider_snapshots")
          .upsert({
            user_id: job.user_id,
            provider: "codeforces",
            profile: {
              handle: info.handle,
              avatar: info.titlePhoto ?? info.avatar,
              rank: info.rank ?? null,
            },
            summary: {
              rating: info.rating ?? null,
              maxRating: info.maxRating ?? null,
              ratedContests: ratings.length,
            },
            history_complete: previous?.history_complete ?? false,
            last_synced_at: previous?.last_synced_at ?? null,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
        if (ratings.length) {
          const { error: ratingError } = await db
            .from("provider_rating_history")
            .upsert(
              ratings.map((item: any) => ({
                user_id: job.user_id,
                provider: "codeforces",
                contest_id: String(item.contestId),
                contest_name: item.contestName,
                contest_rank: item.rank,
                contest_at: new Date(
                  item.ratingUpdateTimeSeconds * 1000,
                ).toISOString(),
                rating_before: item.oldRating,
                rating_after: item.newRating,
              })),
              { onConflict: "user_id,provider,contest_id" },
            );
          if (ratingError) throw ratingError;
        }
        const { data: watermark } = await db
          .from("provider_sync_cursors")
          .select("cursor")
          .eq("user_id", job.user_id)
          .eq("provider", "codeforces")
          .eq("stream", "submissions")
          .maybeSingle();
        cursor.stopId = previous?.submissions_complete
          ? (watermark?.cursor?.maxId ?? 0)
          : 0;
      }
      const submissions = await codeforces(
        "user.status",
        {
          handle: account.username,
          from: String(from),
          count: String(pageSize),
        },
        true,
      );
      if (!Array.isArray(submissions))
        throw new ProviderError(
          "Codeforces did not return a readable submission page.",
        );
      const { error: ingestError } = await db.rpc("ingest_cf_page", {
        p_job_id: job.id,
        p_lease_token: job.lease_token,
        p_submissions: submissions,
      });
      if (ingestError) throw ingestError;
      const newestId = Math.max(
        Number(cursor.newestId ?? 0),
        ...submissions.map((item: any) => Number(item.id)),
        0,
      );
      const complete =
        submissions.length < pageSize ||
        (Number(cursor.stopId) > 0 &&
          submissions.some(
            (item: any) => Number(item.id) <= Number(cursor.stopId),
          ));
      if (complete) {
        const timestamp = new Date().toISOString();
        const { error } = await db
          .from("provider_snapshots")
          .update({
            history_complete: true,
            submissions_complete: true,
            last_synced_at: timestamp,
            updated_at: timestamp,
          })
          .eq("user_id", job.user_id)
          .eq("provider", "codeforces");
        if (error) throw error;
        const { error: cursorError } = await db
          .from("provider_sync_cursors")
          .upsert(
            {
              user_id: job.user_id,
              provider: "codeforces",
              stream: "submissions",
              cursor: { maxId: newestId },
              last_success_at: timestamp,
            },
            { onConflict: "user_id,provider,stream" },
          );
        if (cursorError) throw cursorError;
        const { error: awardError } = await db.rpc("award_pending_cf_solves", {
          p_user_id: job.user_id,
        });
        if (awardError) throw awardError;
        await update({
          status: "succeeded",
          leased_until: null,
          error_code: null,
          cursor: { ...cursor, newestId, from },
        });
      } else
        await update({
          status: "queued",
          run_after: new Date(Date.now() + 2100).toISOString(),
          leased_until: null,
          attempts: 0,
          error_code: null,
          cursor: { ...cursor, newestId, from: from + pageSize },
        });
      processed++;
    } catch (error) {
      const code =
        error instanceof ProviderError ? error.code : "sync_processing_error";
      await update({
        status: job.attempts >= 8 ? "failed" : "retrying",
        run_after: new Date(
          Date.now() +
            Math.min(60 * 60_000, 15_000 * 2 ** Math.min(job.attempts, 7)),
        ).toISOString(),
        leased_until: null,
        error_code: code,
      });
    }
  }
  return { processed };
}
