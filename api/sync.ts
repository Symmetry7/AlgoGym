import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";
export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader("Cache-Control", "private, no-store");
  if (request.method !== "POST")
    return response.status(405).json({ error: "Method not allowed." });
  if (
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
      error,
    } = await client.auth.getUser();
    if (error || !user)
      return response
        .status(401)
        .json({ error: "Sign in to synchronize your coding accounts." });
    const provider = (request.body as { provider?: unknown })?.provider;
    if (provider !== "codeforces" && provider !== "leetcode")
      return response
        .status(400)
        .json({ error: "Choose a supported platform." });
    const result = await client.rpc("request_provider_sync", {
      p_provider: provider,
    });
    if (result.error)
      return response
        .status(409)
        .json({
          error: result.error.message.includes("limit")
            ? "Sync limit reached. Retry after 15 minutes."
            : "Verify your coding account before requesting synchronization.",
        });
    return response.status(202).json({ jobId: result.data, status: "queued" });
  } finally {
    flushCookies();
  }
}
