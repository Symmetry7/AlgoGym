import {
  getSupabaseEnv,
  methodNotAllowed,
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  if (request.method !== "POST") return methodNotAllowed(response, ["POST"]);
  response.setHeader("Cache-Control", "private, no-store");
  const origin = request.headers.origin;
  if (origin && origin !== originFromRequest(request))
    return response
      .status(403)
      .json({ error: "This request could not be verified." });
  try {
    const { client, flushCookies } = serverSupabase(request, response);
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user)
      return response.status(401).json({ error: "Sign in to continue." });
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();
    if (sessionError || !session)
      return response
        .status(401)
        .json({ error: "Your session has expired. Please sign in again." });
    const { url, key } = getSupabaseEnv();
    const upstream = await fetch(`${url}/functions/v1/profile-verification`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request.body ?? {}),
    });
    flushCookies();
    const body = await upstream
      .json()
      .catch(() => ({
        error: "Verification service returned an invalid response.",
      }));
    return response.status(upstream.status).json(body);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Verification service is unavailable. Please retry.";
    return response.status(502).json({ error: message });
  }
}
