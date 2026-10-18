import { z } from "zod";
import {
  serverSupabase,
  originFromRequest,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";
import { refreshContestCatalog } from "../server/contests";
const subscription = z
  .object({ eventId: z.string().uuid(), subscribe: z.boolean() })
  .strict();
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST"].includes(req.method ?? ""))
    return res.status(405).json({ error: "Method not allowed." });
  if (
    req.method === "POST" &&
    req.headers.origin &&
    req.headers.origin !== originFromRequest(req)
  )
    return res
      .status(403)
      .json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return res
        .status(401)
        .json({ error: "Sign in to use your contest calendar." });
    if (req.method === "POST") {
      const parsed = subscription.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: "Choose a valid contest." });
      const result = parsed.data.subscribe
        ? await client.rpc("subscribe_to_contest", {
            p_event: parsed.data.eventId,
          })
        : await client
            .from("contest_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("event_id", parsed.data.eventId);
      if (result.error)
        return res
          .status(400)
          .json({
            error:
              "This contest has ended, is unavailable, or your daily subscription limit was reached.",
          });
      return res.status(200).json({ saved: true });
    }
    const params = new URL(req.url ?? "/", "http://localhost").searchParams;
    const start = Date.parse(params.get("from") ?? "");
    const end = Date.parse(params.get("to") ?? "");
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start ||
      end - start > 93 * 86400000
    )
      return res
        .status(400)
        .json({ error: "Choose a calendar range of up to 93 days." });
    const warnings = await refreshContestCatalog();
    const [events, subscribed] = await Promise.all([
      client
        .from("contest_events")
        .select(
          "id,provider,external_id,title,url,starts_at,ends_at,fetched_at",
        )
        .lt("starts_at", new Date(end).toISOString())
        .gt("ends_at", new Date(start).toISOString())
        .order("starts_at")
        .limit(2000),
      client
        .from("contest_subscriptions")
        .select("id,event_id")
        .eq("user_id", user.id),
    ]);
    if (events.error || subscribed.error) throw new Error("Unavailable");
    const counts = await client.rpc("contest_subscription_counts", {
      p_events: (events.data ?? []).map((event) => event.id),
    });
    if (counts.error) throw counts.error;
    return res
      .status(200)
      .json({
        events: (events.data ?? []).map((event) => ({
          ...event,
          subscribers:
            counts.data?.find((row: any) => row.event_id === event.id)
              ?.subscribers ?? 0,
        })),
        subscriptions: subscribed.data,
        warnings,
        coverage: {
          codeforces: "Official public contest API",
          leetcode: "Public GraphQL contest list; endpoint may change",
          codechef:
            "Public schedule; historical coverage is limited by provider response",
          atcoder:
            "Public active/upcoming contest page; older imported events retained",
        },
      });
  } catch {
    return res
      .status(503)
      .json({
        error:
          "The contest calendar is temporarily unavailable. Your saved subscriptions are preserved; retry shortly.",
      });
  } finally {
    flushCookies();
  }
}
