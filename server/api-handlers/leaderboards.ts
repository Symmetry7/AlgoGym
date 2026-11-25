import { z } from "zod";
import {
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";
const schema = z
  .object({
    scope: z.enum(["individual", "society", "college"]).default("individual"),
    metric: z
      .enum(["chakra", "codeforces_rating", "leetcode_rating", "unique_solves"])
      .default("chakra"),
    country: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    collegeId: z.string().uuid().optional(),
    societyId: z.string().uuid().optional(),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
    period: z.enum(["week", "month", "all"]).default("all"),
    search: z.string().trim().min(1).max(80).optional(),
  })
  .strict();
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed." });
  const parsed = schema.safeParse(
    Object.fromEntries(
      new URL(req.url ?? "/", "http://localhost").searchParams,
    ),
  );
  if (!parsed.success)
    return res.status(400).json({ error: "Choose valid ranking filters." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const value = parsed.data;
    if (value.period !== "all" && (value.scope !== "individual" || value.metric !== "unique_solves" || value.country))
      return res.status(400).json({ error: "Time periods are available for verified individual solves only." });
    if (value.search && value.scope !== "society")
      return res.status(400).json({ error: "Society search is available on the society leaderboard." });
    const periodSolves = value.period !== "all" && value.scope === "individual" && value.metric === "unique_solves" && !value.country;
    const rpc = value.search ? "search_society_leaderboard" : periodSolves ? "read_verified_solve_leaderboard" : "read_leaderboard";
    const { data, error } = await client.rpc(rpc, value.search ? {
      p_metric: value.metric,
      p_country: value.country ?? null,
      p_college: value.collegeId ?? null,
      p_society: value.societyId ?? null,
      p_offset: value.offset,
      p_limit: 50,
      p_search: value.search,
    } : periodSolves ? {
      p_period: value.period,
      p_college: value.collegeId ?? null,
      p_society: value.societyId ?? null,
      p_offset: value.offset,
      p_limit: 50,
    } : {
      p_scope: value.scope,
      p_metric: value.metric,
      p_country: value.country ?? null,
      p_college: value.collegeId ?? null,
      p_society: value.societyId ?? null,
      p_offset: value.offset,
      p_limit: 50,
    });
    if (error)
      return res
        .status(503)
        .json({
          error: "Rankings could not be calculated. Please retry shortly.",
        });
    return res.status(200).json(data);
  } finally {
    flushCookies();
  }
}
