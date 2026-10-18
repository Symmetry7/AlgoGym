import {
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../../supabase";
import { safeNextPath } from "../../auth-policy";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  if (request.method !== "GET")
    return response.status(405).end("Method not allowed.");
  const params = new URL(
    request.url ?? "/api/auth/callback",
    "http://localhost",
  ).searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const next = safeNextPath(
    params.get("next"),
    type === "recovery" ? "/account/reset-password" : "/dashboard",
  );
  response.setHeader("Cache-Control", "private, no-store");
  const emailTypes = ["email", "signup", "recovery", "email_change"] as const;
  if (
    !code &&
    !(tokenHash && emailTypes.includes(type as (typeof emailTypes)[number]))
  )
    return response.redirect(303, "/sign-in?auth_error=1");
  try {
    const { client, flushCookies } = serverSupabase(request, response);
    const { error } = code
      ? await client.auth.exchangeCodeForSession(code)
      : await client.auth.verifyOtp({
          token_hash: tokenHash!,
          type: type as (typeof emailTypes)[number],
        });
    flushCookies();
    if (error) return response.redirect(303, "/sign-in?auth_error=1");
    return response.redirect(303, next);
  } catch {
    return response.redirect(303, "/sign-in?auth_error=1");
  }
}
