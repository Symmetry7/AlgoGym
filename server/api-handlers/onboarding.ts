import { z } from "zod";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";
const schema = z
  .object({
    displayName: z.string().trim().min(2).max(80),
    academicYear: z.enum([
      "First Year",
      "Second Year",
      "Third Year",
      "Fourth Year",
      "Fifth Year",
      "Graduated",
    ]),
    collegeId: z.string().uuid().nullable(),
    step: z.number().int().min(1).max(6),
  })
  .strict();
export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader("Cache-Control", "private, no-store");
  if (request.method !== "GET" && request.method !== "PATCH")
    return response.status(405).json({ error: "Method not allowed." });
  if (
    request.method === "PATCH" &&
    request.headers.origin &&
    request.headers.origin !== originFromRequest(request)
  )
    return response
      .status(403)
      .json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(request, response);
  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user)
      return response
        .status(401)
        .json({ error: "Sign in to set up your profile." });
    if (request.method === "PATCH") {
      const parsed = schema.safeParse(request.body);
      if (!parsed.success)
        return response
          .status(400)
          .json({
            error:
              "Enter your name, academic year, and a valid college selection.",
          });
      const value = parsed.data;
      const { error } = await client.rpc("save_onboarding", {
        p_display_name: value.displayName,
        p_academic_year: value.academicYear,
        p_college_id: value.collegeId,
        p_step: value.step,
      });
      if (error)
        return response
          .status(400)
          .json({
            error: error.message.includes("Select")
              ? error.message
              : "Your setup could not be saved. Check the fields and retry.",
          });
    }
    const [profile, accounts, requests, memberships] = await Promise.all([
      client
        .from("profiles")
        .select(
          "id,display_name,avatar_url,username,is_public,bio,country_code,website_url,github_url,linkedin_url,x_url,academic_year,college_id,onboarding_step,onboarding_completed_at,created_at,colleges(id,name,city,state)",
        )
        .eq("id", user.id)
        .single(),
      client
        .from("coding_profiles")
        .select("platform,username,verified_at")
        .eq("user_id", user.id),
      client
        .from("college_requests")
        .select("id,name,status,college_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      client
        .from("memberships")
        .select("id,society_id,status,role,societies(name,slug)")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"]),
    ]);
    if (profile.error || accounts.error || requests.error || memberships.error)
      return response
        .status(503)
        .json({
          error:
            "Profile setup is temporarily unavailable. Please retry shortly.",
        });
    return response
      .status(200)
      .json({
        profile: profile.data,
        accounts: accounts.data,
        collegeRequests: requests.data,
        memberships: memberships.data,
      });
  } finally {
    flushCookies();
  }
}
