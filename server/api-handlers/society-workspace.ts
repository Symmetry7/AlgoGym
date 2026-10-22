import { z } from "zod";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";

const uuid = z.string().uuid();
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("moderator"), membershipId: uuid, promote: z.boolean(), reviewRequests: z.boolean().default(false), manageMembers: z.boolean().default(false), viewActivity: z.boolean().default(false), manageContests: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal("removeMember"), membershipId: uuid }).strict(),
  z.object({ action: z.literal("policy"), joinPolicy: z.enum(["open", "approval", "invite"]), weeklySolves: z.number().int().min(0).max(1000), inactiveDays: z.number().int().min(1).max(365) }).strict(),
  z.object({ action: z.literal("announcement"), title: z.string().trim().min(3).max(180), body: z.string().trim().min(1).max(20000), pinned: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal("deleteAnnouncement"), announcementId: uuid }).strict(),
  z.object({ action: z.literal("warning"), memberId: uuid, reason: z.enum(["low_activity", "no_recent_activity", "missed_contests", "custom"]), message: z.string().trim().min(20).max(1000) }).strict(),
  z.object({ action: z.literal("acknowledgeWarning"), warningId: uuid, explanation: z.string().trim().max(2000) }).strict(),
]);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (req.method === "POST" && req.headers.origin && req.headers.origin !== originFromRequest(req))
    return res.status(403).json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Sign in to use this society workspace." });
    const params = new URL(req.url ?? "/", "http://localhost").searchParams;
    const societyId = params.get("societyId");
    if (!societyId || !uuid.safeParse(societyId).success) return res.status(400).json({ error: "Choose a valid society." });
    if (req.method === "GET") {
      if (params.get("view") === "warnings") {
        const { data, error } = await client.from("society_warnings").select("id,reason,message,acknowledged_at,explanation,created_at").eq("society_id", societyId).eq("member_id", user.id).order("created_at", { ascending: false }).limit(30);
        if (error) return res.status(503).json({ error: "Private notes are unavailable." });
        return res.status(200).json({ warnings: data ?? [] });
      }
      const rpc = params.get("view") === "admin" ? "read_society_admin" : "read_society_workspace";
      const { data, error } = await client.rpc(rpc, { p_society: societyId });
      if (error) return res.status(/not authorized|active membership/i.test(error.message) ? 403 : 503).json({ error: /not authorized|active membership/i.test(error.message) ? "You do not have access to this workspace." : "Society workspace is unavailable. The database upgrade may still be pending." });
      return res.status(200).json(data);
    }
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Check the society action details." });
    const value = parsed.data;
    let operation: PromiseLike<{ data: unknown; error: { message: string } | null }>;
    switch (value.action) {
      case "moderator": operation = client.rpc("set_society_moderator", { p_membership: value.membershipId, p_promote: value.promote, p_review_requests: value.reviewRequests, p_manage_members: value.manageMembers, p_view_activity: value.viewActivity, p_manage_contests: value.manageContests }); break;
      case "removeMember": operation = client.rpc("remove_society_member", { p_membership: value.membershipId }); break;
      case "policy": operation = client.rpc("set_society_policy", { p_society: societyId, p_join_policy: value.joinPolicy, p_weekly_solves: value.weeklySolves, p_inactive_days: value.inactiveDays }); break;
      case "announcement": operation = client.rpc("publish_society_announcement", { p_society: societyId, p_title: value.title, p_body: value.body, p_pinned: value.pinned }); break;
      case "deleteAnnouncement": operation = client.rpc("delete_society_announcement", { p_society: societyId, p_announcement: value.announcementId }); break;
      case "warning": operation = client.rpc("send_society_warning", { p_society: societyId, p_member: value.memberId, p_reason: value.reason, p_message: value.message }); break;
      case "acknowledgeWarning": operation = client.rpc("acknowledge_society_warning", { p_warning: value.warningId, p_explanation: value.explanation }); break;
    }
    const { data, error } = await operation;
    if (error) return res.status(/not authorized|active membership/i.test(error.message) ? 403 : 400).json({ error: error.message });
    return res.status(200).json({ result: data });
  } finally {
    flushCookies();
  }
}
