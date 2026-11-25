import {
  methodNotAllowed,
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../../supabase";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  if (request.method !== "POST") return methodNotAllowed(response, ["POST"]);
  const origin = request.headers.origin;
  if (origin && origin !== originFromRequest(request))
    return response
      .status(403)
      .json({ error: "This request could not be verified." });
  try {
    const { client, flushCookies } = serverSupabase(request, response);
    await client.auth.signOut();
    flushCookies();
    return response.status(204).end();
  } catch {
    return response
      .status(500)
      .json({ error: "Sign-out failed. Please try again." });
  }
}
