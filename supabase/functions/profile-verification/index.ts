import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";
import { getExtraPublicProfile } from "./public-profiles.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

type Platform = "codeforces" | "leetcode" | "codechef" | "atcoder" | "github" | "geeksforgeeks";
const tokenAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const encoder = new TextEncoder();

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function newToken(platform: Platform) {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const code = [...bytes].map((byte) => tokenAlphabet[byte % tokenAlphabet.length]).join("");
  const prefix = { codeforces: "CF", leetcode: "LC", codechef: "CC", atcoder: "AC", github: "GH", geeksforgeeks: "GFG" };
  return `VERIFY-${prefix[platform]}-${code}`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && ["codeforces", "leetcode", "codechef", "atcoder", "github", "geeksforgeeks"].includes(value);
}

async function getPublicProfile(platform: Platform, username: string) {
  if (platform !== "codeforces" && platform !== "leetcode") return getExtraPublicProfile(platform, username);
  const signal = AbortSignal.timeout(8000);
  if (platform === "codeforces") {
    const url = new URL("https://codeforces.com/api/user.info");
    url.searchParams.set("handles", username);
    const result = await fetch(url, { cache: "no-store", signal, headers: { "Cache-Control": "no-cache" } });
    if (result.status === 429 || result.status >= 500) throw new Error("The platform is temporarily unavailable. Please retry shortly.");
    if (!result.ok) return { exists: false };
    const data = await result.json();
    if (data.status !== "OK" || !Array.isArray(data.result) || !data.result[0]) return { exists: false };
    const profile = data.result[0];
    return { exists: true, username: profile.handle as string, challenge: profile.firstName as string | undefined };
  }

  const result = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    cache: "no-store",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store",
      "User-Agent": "AlgoGym profile verification",
    },
    body: JSON.stringify({
      query: "query publicProfile($username: String!) { matchedUser(username: $username) { username profile { aboutMe } } }",
      variables: { username },
    }),
  });
  if (result.status === 429 || result.status >= 500) throw new Error("LeetCode is temporarily unavailable. Please retry shortly.");
  if (!result.ok) throw new Error("LeetCode could not be reached. Please retry shortly.");
  const data = await result.json();
  const profile = data?.data?.matchedUser;
  if (data?.errors?.length) throw new Error("LeetCode could not return public profile details. Please retry shortly.");
  if (!profile?.username) return { exists: false };
  if (typeof profile.profile?.aboutMe !== "string") {
    throw new Error("LeetCode did not return a readable public Summary for this profile. Verification is unavailable until that field is public.");
  }
  return { exists: true, username: profile.username as string, challenge: profile.profile.aboutMe as string };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return response({ error: "Sign in to continue." }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return response({ error: "Verification service is not configured." }, 503);

  const authClient = createClient(url, anonKey, { auth: { persistSession: false }, global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return response({ error: "Your session has expired. Please sign in again." }, 401);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    const body = await request.json();
    const platform = body.platform;
    const action = body.action;
    if (!isPlatform(platform) || !["status", "start", "verify", "complete"].includes(action)) {
      return response({ error: "Invalid verification request." }, 400);
    }

    if (action === "status") {
      const [{ data: profiles, error: profilesError }, { data: challenges, error: challengesError }, { data: appProfile, error: appError }] = await Promise.all([
        admin.from("coding_profiles").select("platform, username, verified_at").eq("user_id", user.id),
        admin.from("profile_verification_challenges").select("platform, username, expires_at").eq("user_id", user.id).gt("expires_at", new Date().toISOString()),
        admin.from("app_profiles").select("onboarding_completed_at").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profilesError || challengesError || appError) throw new Error("Unable to load your verified profiles.");
      return response({ profiles: profiles ?? [], challenges: challenges ?? [], onboardingCompleted: Boolean(appProfile?.onboarding_completed_at) });
    }

    if (action === "complete") {
      const { count, error } = await admin.from("coding_profiles").select("platform", { count: "exact", head: true }).eq("user_id", user.id).in("platform", ["codeforces", "leetcode"]);
      if (error) throw new Error("Unable to confirm your profiles.");
      if (count !== 2) return response({ error: "Verify both coding profiles before continuing." }, 409);
      const { error: updateError } = await admin.from("app_profiles").upsert({ user_id: user.id, onboarding_completed_at: new Date().toISOString() });
      if (updateError) throw new Error("Unable to save onboarding completion.");
      return response({ ok: true });
    }

    const username = typeof body.username === "string" ? body.username.trim() : "";
    if (!username || username.length > 50 || !/^[\w.-]+$/.test(username)) return response({ error: "Enter a valid username." }, 400);

    const { data: existing, error: existingError } = await admin.from("coding_profiles").select("username, verified_at").eq("user_id", user.id).eq("platform", platform).maybeSingle();
    if (existingError) throw new Error("Unable to load your connected profile.");
    if (existing) return response({ error: "A verified profile is already connected for this platform." }, 409);

    const { data: duplicate } = await admin.from("coding_profiles").select("user_id").eq("platform", platform).eq("username_normalized", username.toLowerCase()).maybeSingle();
    if (duplicate && duplicate.user_id !== user.id) return response({ error: "This profile is already connected to another AlgoGym account." }, 409);

    const { data: challenge } = await admin.from("profile_verification_challenges").select("username, expires_at, attempt_count").eq("user_id", user.id).eq("platform", platform).maybeSingle();
    if (action === "start") {
      const { count } = await admin.from("profile_verification_events").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("platform", platform).eq("event", "generate").gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
      if ((count ?? 0) >= 5) return response({ error: "Too many codes were requested. Try again in an hour." }, 429);
      const profile = await getPublicProfile(platform, username);
      if (!profile.exists) return response({ error: `No ${platform} profile was found for that username.` }, 404);
      const token = newToken(platform);
      const { data: expiresAt, error: challengeError } = await admin.rpc("create_owned_challenge", { p_user: user.id, p_platform: platform, p_username: profile.username, p_token_hash: await sha256(token) });
      if (challengeError) throw new Error(challengeError.message.includes("Too many") ? "Too many codes requested. Retry in an hour." : "Unable to start verification. Please retry.");
      return response({ username: profile.username, token, expiresAt });
    }

    if (!challenge || challenge.username.toLowerCase() !== username.toLowerCase()) return response({ error: "Start a new verification for this username." }, 409);
    if (new Date(challenge.expires_at).getTime() <= Date.now()) return response({ error: "This code expired. Generate a new code to continue." }, 410);
    if (challenge.attempt_count >= 5) return response({ error: "Too many attempts. Generate a new code to continue." }, 429);
    const { count } = await admin.from("profile_verification_events").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("platform", platform).eq("event", "verify").gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((count ?? 0) >= 20) return response({ error: "Too many verification attempts. Try again in an hour." }, 429);
    if (typeof body.token !== "string" || body.token.length > 100) return response({ error: "Generate a new verification code." }, 400);
    const tokenHash = await sha256(body.token);
    const { data: attempt, error: attemptError } = await admin.rpc("consume_challenge_attempt", { p_user: user.id, p_platform: platform, p_username: username, p_token_hash: tokenHash });
    if (attemptError) throw new Error("Unable to check the code. Please retry.");
    if (!attempt?.ok) return response({ error: attempt?.code === "expired" ? "This code expired. Generate a new code." : attempt?.code === "rate_limited" ? "Too many attempts. Generate a new code or retry later." : "The active code does not match. Generate a new code to continue." }, attempt?.code === "rate_limited" ? 429 : 422);
    const profile = await getPublicProfile(platform, challenge.username);
    if (!profile.exists) throw new Error("The public profile could not be loaded. Your verification remains pending; please retry.");
    const { data: fullChallenge } = await admin.from("profile_verification_challenges").select("token_hash").eq("user_id", user.id).eq("platform", platform).maybeSingle();
    if (!fullChallenge || !constantTimeEqual(fullChallenge.token_hash, await sha256(body.token ?? ""))) return response({ error: "The verification code does not match. Check your profile and try again." }, 422);
    const challengeMatches = ["codeforces", "codechef", "atcoder"].includes(platform)
      ? profile.challenge === body.token
      : typeof profile.challenge === "string" && new RegExp(`(^|[^A-Za-z0-9-])${body.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^A-Za-z0-9-])`).test(profile.challenge);
    if (profile.username.toLowerCase() !== challenge.username.toLowerCase() || !challengeMatches) {
      return response({ error: "The code is not visible on that profile yet. Save it and retry." }, 422);
    }

    const { data: verifiedAt, error: saveError } = await admin.rpc("claim_verified_profile", { p_user: user.id, p_platform: platform, p_username: profile.username, p_token_hash: tokenHash });
    if (saveError?.code === "23505") return response({ error: "This profile is already connected to another AlgoGym account." }, 409);
    if (saveError) throw new Error("Unable to save verification. Please retry.");
    return response({ verified: true, username: profile.username, platform, verified_at: verifiedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification is temporarily unavailable. Please retry.";
    return response({ error: message }, 502);
  }
});
