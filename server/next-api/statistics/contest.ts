import { NextRequest } from "next/server";
import { runApiHandler } from "../../next-adapter";
import { serverSupabase } from "../../supabase";
import { codeforces, ProviderError } from "../../providers";
export const maxDuration = 60;
export function GET(request: NextRequest) {
  return runApiHandler(request, async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const contestId = new URL(req.url!).searchParams.get("id");
    if (!contestId || !/^\d{1,8}$/.test(contestId))
      return res.status(400).json({ error: "Choose a rated contest." });
    const { client, flushCookies } = serverSupabase(req, res);
    try {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user)
        return res
          .status(401)
          .json({ error: "Sign in to view contest analysis." });
      const [account, rating] = await Promise.all([
        client
          .from("coding_profiles")
          .select("username")
          .eq("user_id", user.id)
          .eq("platform", "codeforces")
          .maybeSingle(),
        client
          .from("provider_rating_history")
          .select("id")
          .eq("user_id", user.id)
          .eq("provider", "codeforces")
          .eq("contest_id", contestId)
          .maybeSingle(),
      ]);
      if (!account.data || !rating.data)
        return res
          .status(404)
          .json({
            error: "Select a rated contest from your synchronized history.",
          });
      // Current public regular-contest API accepts only contestId; filter the official rows locally.
      const data = await codeforces("contest.standings", { contestId });
      return res
        .status(200)
        .json({
          contest: {
            id: data.contest.id,
            name: data.contest.name,
            duration: data.contest.durationSeconds,
            start: data.contest.startTimeSeconds,
          },
          problems: data.problems.map((item: any) => ({
            index: item.index,
            title: item.name,
            rating: item.rating ?? null,
            tags: item.tags ?? [],
          })),
          row:
            data.rows?.find((row: any) =>
              row.party?.members?.some(
                (member: any) =>
                  member.handle.toLowerCase() ===
                  account.data.username.toLowerCase(),
              ),
            ) ?? null,
        });
    } catch (error) {
      return res
        .status(503)
        .json({
          error:
            error instanceof ProviderError
              ? error.message
              : "Contest standings are temporarily unavailable. Retry shortly.",
        });
    } finally {
      flushCookies();
    }
  });
}
