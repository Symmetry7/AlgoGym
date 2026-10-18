import { z } from "zod";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";
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
    if (req.method === "POST") {
      if (!user)
        return res
          .status(401)
          .json({ error: "Sign in to join." });
      const parsed = z
        .object({ societyId: z.string().uuid() })
        .strict()
        .safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: "Choose a valid society." });
      const { data, error } = await client.rpc("apply_to_society", {
        p_society_id: parsed.data.societyId,
      });
      if (error)
        return res
          .status(409)
          .json({
            error:
              "This society is unavailable, your membership is restricted, or the join limit was reached.",
          });
      return res.status(200).json({ membershipId: data, status: "active" });
    }
    const params = new URL(req.url ?? "/", "http://localhost").searchParams;
    const slug = params.get("slug");
    const college = params.get("collegeId");
    const search = (params.get("search") ?? "")
      .trim()
      .slice(0, 80)
      .replace(/[%,_]/g, "");
    const offset = Number(params.get("offset") ?? 0);
    if (
      (college && !z.string().uuid().safeParse(college).success) ||
      (slug && !/^[a-z0-9-]{2,80}$/.test(slug)) ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 100000
    )
      return res.status(400).json({ error: "Choose valid community filters." });
    let query = client
      .from("societies")
      .select("id,name,slug,description,college_id,colleges(name,city,state)", {
        count: "exact",
      })
      .eq("status", "approved")
      .order("name")
      .range(offset, offset + 49);
    if (college) query = query.eq("college_id", college);
    if (slug) query = query.eq("slug", slug);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    const ids = (data ?? []).map((item) => item.id);
    const summary = await client.rpc("public_society_summary", {
      p_societies: ids,
    });
    if (summary.error) throw summary.error;
    let memberships: any[] = [];
    if (user && ids.length) {
      const result = await client
        .from("memberships")
        .select("society_id,status,role")
        .eq("user_id", user.id)
        .in("society_id", ids)
        .order("created_at", { ascending: false });
      if (result.error) throw result.error;
      memberships = result.data ?? [];
    }
    let members: any[] = [];
    if (slug && data?.[0]) {
      const result = await client.rpc("public_society_members", {
        p_society: data[0].id,
        p_offset: Number(params.get("memberOffset") ?? 0),
      });
      if (result.error) throw result.error;
      members = result.data ?? [];
    }
    return res
      .status(200)
      .json({
        societies: (data ?? []).map((item) => ({
          ...item,
          summary: summary.data?.find((entry: any) => entry.id === item.id) ?? {
            members: 0,
            eligible_members: 0,
            average_cf_rating: null,
          },
        })),
        memberships,
        members,
        total: count,
      });
  } catch {
    return res
      .status(503)
      .json({ error: "Community data could not be loaded. Retry shortly." });
  } finally {
    flushCookies();
  }
}
