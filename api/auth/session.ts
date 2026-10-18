import {
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../../server/supabase";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  if (request.method !== "GET")
    return response.status(405).json({ error: "Method not allowed." });
  response.setHeader("Cache-Control", "private, no-store");
  try {
    const { client, flushCookies } = serverSupabase(request, response);
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    flushCookies();
    if (error && (error.status ?? 0) >= 500)
      return response
        .status(503)
        .json({
          error: "The authentication service is temporarily unavailable.",
        });
    return response
      .status(200)
      .json({
        user: user
          ? {
              id: user.id,
              email: user.email,
              created_at: user.created_at,
              user_metadata: user.user_metadata,
              providers: user.app_metadata.providers ?? [],
            }
          : null,
      });
  } catch {
    return response
      .status(503)
      .json({ error: "Your session could not be restored. Please retry." });
  }
}
