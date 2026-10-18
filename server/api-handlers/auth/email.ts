import { z } from "zod";
import { allowAuthAttempt, safeNextPath } from "../../auth-policy";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../../supabase";

const schema = z.object({
  action: z.enum(["login", "signup", "reset", "update-password"]),
  email: z.string().email().max(254).optional(),
  password: z.string().min(1).max(128).optional(),
  fullName: z.string().trim().min(2).max(80).optional(),
  next: z.string().optional(),
});
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
  const parsed = schema.safeParse(request.body);
  if (!parsed.success)
    return response
      .status(400)
      .json({
        error: "Enter a valid email and a password with at least 8 characters.",
      });
  const { action, email, password, fullName, next } = parsed.data;
  if (
    (action === "signup" || action === "update-password") &&
    (password?.length ?? 0) < 8
  )
    return response
      .status(400)
      .json({ error: "Use at least 8 characters for your new password." });
  if (
    (action !== "update-password" && !email) ||
    (action !== "reset" && !password) ||
    (action === "signup" && !fullName)
  )
    return response
      .status(400)
      .json({ error: "Complete all required fields." });
  const ip = String(request.headers["x-forwarded-for"] ?? "local").split(
    ",",
  )[0];
  if (
    !allowAuthAttempt(
      `${ip}:${action}`,
      action === "reset" || action === "signup" ? 5 : 20,
      15 * 60_000,
    )
  ) {
    response.setHeader("Retry-After", "900");
    return response
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  }
  const { client, flushCookies } = serverSupabase(request, response);
  try {
    if (action === "login") {
      const { error } = await client.auth.signInWithPassword({
        email: email!,
        password: password!,
      });
      if (error)
        return response
          .status(error.status === 429 ? 429 : 400)
          .json({
            error:
              error.code === "email_not_confirmed"
                ? "Confirm your email before signing in."
                : "The email or password is incorrect. Please try again.",
          });
      return response
        .status(200)
        .json({ authenticated: true, next: safeNextPath(next) });
    }
    if (action === "signup") {
      const { data, error } = await client.auth.signUp({
        email: email!,
        password: password!,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${originFromRequest(request)}/api/auth/callback?next=${encodeURIComponent(safeNextPath(next, "/onboarding"))}`,
        },
      });
      if (error)
        return response
          .status(error.status === 429 ? 429 : 400)
          .json({
            error:
              "Your account could not be created. Try again or sign in if you already have an account.",
          });
      return response
        .status(200)
        .json({
          authenticated: Boolean(data.session),
          confirmationRequired: !data.session,
        });
    }
    if (action === "reset") {
      const { error } = await client.auth.resetPasswordForEmail(email!, {
        redirectTo: `${originFromRequest(request)}/api/auth/callback?next=/account/reset-password`,
      });
      if (error)
        return response
          .status(error.status === 429 ? 429 : 503)
          .json({
            error: "The recovery email could not be sent. Please retry later.",
          });
      return response
        .status(200)
        .json({
          message:
            "If this email has an account, a recovery link has been sent.",
        });
    }
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user)
      return response
        .status(401)
        .json({
          error:
            "Open the recovery link in your email before choosing a new password.",
        });
    const { error } = await client.auth.updateUser({ password: password! });
    if (error)
      return response
        .status(400)
        .json({
          error:
            "Your password could not be updated. Use a different password or request a new recovery link.",
        });
    return response.status(200).json({ message: "Password updated." });
  } finally {
    flushCookies();
  }
}
