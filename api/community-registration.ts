import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  serverSupabase,
  originFromRequest,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";
const schema = z
  .object({
    collegeId: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().max(2000).default(""),
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
      return res.status(401).json({ error: "Sign in to register a society." });
    if (req.method === "POST") {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({
          error: "Enter a society name between 3 and 100 characters.",
        });
      const value = parsed.data;
      const slug = `${
        value.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 55) || "society"
      }-${randomUUID().slice(0, 8)}`;
      const { data, error } = await client.rpc("register_society", {
        p_college: value.collegeId ?? null,
        p_name: value.name,
        p_slug: slug,
        p_description: value.description,
        p_evidence: null,
      });
      if (error)
        return res.status(error.code === "23505" ? 409 : 400).json({
          error:
            error.code === "23505"
              ? "Please retry to generate a new society URL."
              : "Society could not be created. Check the college or try again later. You can create up to three societies per day.",
        });
      return res.status(201).json({ id: data, slug, status: "active" });
    }
    const { data, error } = await client
      .from("societies")
      .select("id,name,slug,status,created_at,colleges(name)")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return res.status(200).json({ societies: data });
  } catch {
    return res.status(503).json({
      error: "Society creation is temporarily unavailable. Please retry.",
    });
  } finally {
    flushCookies();
  }
}
