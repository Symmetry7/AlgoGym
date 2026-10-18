import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader("Cache-Control", "private, no-store");
  const { client, flushCookies } = serverSupabase(request, response);
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) {
    flushCookies();
    return response
      .status(401)
      .json({ error: "Sign in to manage society membership." });
  }
  const slug =
    new URL(request.url ?? "/", originFromRequest(request)).searchParams.get(
      "slug",
    ) ?? "";
  if (!/^[a-z0-9-]{2,80}$/.test(slug))
    return response.status(400).json({ error: "Choose a valid society." });
  if (request.method === "GET") {
    const { data, error } = await client.rpc(
      "list_society_membership_requests",
      { p_slug: slug },
    );
    flushCookies();
    if (error)
      return response
        .status(error.message.includes("Not authorized") ? 403 : 503)
        .json({
          error: error.message.includes("Not authorized")
            ? "You do not have permission to manage this society."
            : "Society review data is unavailable until the reviewed database migration is applied.",
        });
    return response.status(200).json({ requests: data ?? [] });
  }
  if (request.method === "POST") {
    const origin = request.headers.origin;
    if (origin && origin !== originFromRequest(request))
      return response
        .status(403)
        .json({ error: "This request could not be verified." });
    const body = (request.body ?? {}) as Record<string, unknown>;
    const membershipId =
      typeof body.membershipId === "string" ? body.membershipId : "";
    const decision = body.decision;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        membershipId,
      ) ||
      !["active", "rejected"].includes(String(decision))
    )
      return response
        .status(400)
        .json({ error: "Choose a valid request and decision." });
    const { data, error } = await client.rpc("review_society_membership", {
      p_membership_id: membershipId,
      p_decision: decision,
    });
    flushCookies();
    if (error)
      return response
        .status(error.message.includes("Not authorized") ? 403 : 409)
        .json({
          error: error.message.includes("Not authorized")
            ? "You do not have permission to review this request."
            : "This request could not be updated.",
        });
    return response.status(200).json({ updated: Boolean(data) });
  }
  flushCookies();
  response.setHeader("Allow", "GET, POST");
  return response.status(405).json({ error: "Method not allowed." });
}
