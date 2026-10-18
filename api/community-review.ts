import { z } from "zod";
import {
  serverSupabase,
  originFromRequest,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";
const schema = z
  .object({
    kind: z.enum(["society", "college"]),
    id: z.string().uuid(),
    approve: z.boolean(),
    reason: z.string().trim().max(500).default(""),
    collegeId: z.string().uuid().nullable().optional(),
  })
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
        .json({ error: "Sign in to access community review." });
    const role = await client.rpc("is_platform_admin");
    if (role.error) throw role.error;
    if (!role.data)
      return res
        .status(403)
        .json({
          error:
            "Only a designated platform administrator can review these applications.",
        });
    if (req.method === "POST") {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ error: "Choose a request and a valid review decision." });
      const value = parsed.data;
      const { error } = await client.rpc("review_community_request", {
        p_kind: value.kind,
        p_id: value.id,
        p_approve: value.approve,
        p_reason: value.reason,
        p_college: value.collegeId ?? null,
      });
      if (error)
        return res
          .status(409)
          .json({
            error:
              "This request is already reviewed or its canonical institution could not be resolved. Refresh and retry.",
          });
      return res.status(200).json({ reviewed: true });
    }
    const { data, error } = await client.rpc("community_review_queue");
    if (error) throw error;
    return res.status(200).json(data);
  } catch {
    return res
      .status(503)
      .json({
        error: "Community review is temporarily unavailable. Retry shortly.",
      });
  } finally {
    flushCookies();
  }
}
