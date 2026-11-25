import {
  methodNotAllowed,
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../../supabase";
import { safeNextPath } from "../../auth-policy";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  if (request.method !== "GET") return methodNotAllowed(response, ["GET"]);
  response.setHeader("Cache-Control", "private, no-store");
  try {
    const { client, flushCookies } = serverSupabase(request, response);
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${originFromRequest(request)}/api/auth/callback?next=${encodeURIComponent(safeNextPath(new URL(request.url ?? "/", "http://localhost").searchParams.get("next")))}`,
        skipBrowserRedirect: true,
      },
    });
    flushCookies();
    if (error || !data.url)
      return response
        .status(502)
        .json({
          error: "Google sign-in could not be started. Please try again.",
        });
    return response.status(200).json({ url: data.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Google sign-in could not be started.";
    return response.status(500).json({ error: message });
  }
}
