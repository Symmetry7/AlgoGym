import { z } from "zod";
import { originFromRequest, serverSupabase, type ApiRequest, type ApiResponse } from "../supabase";
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (req.method === "POST" && req.headers.origin && req.headers.origin !== originFromRequest(req)) return res.status(403).json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return res.status(401).json({ error: "Sign in to view notifications." });
    if (req.method === "GET") {
      const { data, error } = await client.from("society_notifications").select("id,society_id,kind,title,body,href,read_at,created_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (error) return res.status(503).json({ error: "Notifications are unavailable. The database upgrade may still be pending." });
      return res.status(200).json({ notifications: data ?? [], unread: (data ?? []).filter((item) => !item.read_at).length });
    }
    const parsed = z.object({ ids: z.array(z.string().uuid()).max(100).nullable() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Choose valid notifications." });
    const { data, error } = await client.rpc("mark_society_notifications_read", { p_ids: parsed.data.ids });
    if (error) return res.status(503).json({ error: "Notifications could not be updated." });
    return res.status(200).json({ updated: data });
  } finally { flushCookies(); }
}
