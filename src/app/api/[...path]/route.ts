import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (request: NextRequest) => Response | Promise<Response>;
type RouteModule = Partial<Record<"GET" | "POST" | "PATCH", RouteHandler>>;
type RouteContext = { params: Promise<{ path: string[] }> };

// A single Vercel function serves the existing API URLs on the Hobby plan.
// Each module retains its own validation, authentication, and response logic.
const routes: Record<string, () => Promise<RouteModule>> = {
  "account/profile": () => import("@/../server/next-api/account/profile"),
  "auth/callback": () => import("@/../server/next-api/auth/callback"),
  "auth/email": () => import("@/../server/next-api/auth/email"),
  "auth/google": () => import("@/../server/next-api/auth/google"),
  "auth/session": () => import("@/../server/next-api/auth/session"),
  "auth/signout": () => import("@/../server/next-api/auth/signout"),
  billing: () => import("@/../server/next-api/billing"),
  "billing/webhook": () => import("@/../server/next-api/billing-webhook"),
  interview: () => import("@/../server/next-api/interview"),
  // Legacy endpoints still used by surviving pages until their milestones replace them:
  // account state (onboarding GET), /problems catalog and detail (providers, problem, tracker, sync, study),
  // and /pricing's coin exchange (M17).
  "coin-exchange": () => import("@/../server/next-api/coin-exchange"),
  onboarding: () => import("@/../server/next-api/onboarding"),
  problem: () => import("@/../server/next-api/problem"),
  "providers/codeforces": () => import("@/../server/next-api/providers/codeforces"),
  "providers/leetcode/problems": () =>
    import("@/../server/next-api/providers/leetcode/problems"),
  study: () => import("@/../server/next-api/study"),
  sync: () => import("@/../server/next-api/sync"),
  tracker: () => import("@/../server/next-api/tracker"),
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function dispatch(
  method: "GET" | "POST" | "PATCH",
  request: NextRequest,
  context: RouteContext,
) {
  const { path } = await context.params;
  const load = routes[path.join("/")];
  if (!load)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const route = await load();
  const handler = route[method];
  if (!handler)
    return NextResponse.json(
      { error: "Method not allowed." },
      {
        status: 405,
        headers: { Allow: Object.keys(route).filter((key) => /^(GET|POST|PATCH)$/.test(key)).join(", ") },
      },
    );
  return handler(request);
}

export const GET = (request: NextRequest, context: RouteContext) =>
  dispatch("GET", request, context);
export const POST = (request: NextRequest, context: RouteContext) =>
  dispatch("POST", request, context);
export const PATCH = (request: NextRequest, context: RouteContext) =>
  dispatch("PATCH", request, context);
