import { NextRequest, NextResponse } from "next/server";
import { codeforces, ProviderError } from "../../providers";
import { allowAuthAttempt } from "../../auth-policy";
const resources = [
  "user.info",
  "user.status",
  "user.rating",
  "contest.list",
  "problemset.problems",
] as const;
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const resource = params.get("resource") as (typeof resources)[number];
  if (!resources.includes(resource))
    return NextResponse.json(
      { error: "Unsupported Codeforces resource." },
      { status: 400 },
    );
  const forwarded: Record<string, string> = {};
  if (resource.startsWith("user.")) {
    const key = resource === "user.info" ? "handles" : "handle";
    const handle = params.get(key);
    if (!handle || !/^[\w.-]{1,50}$/.test(handle))
      return NextResponse.json(
        { error: "Enter a valid Codeforces handle." },
        { status: 400 },
      );
    forwarded[key] = handle;
  }
  if (resource === "user.status") {
    const count = Number(params.get("count") ?? 1000);
    const from = Number(params.get("from") ?? 1);
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 1000 ||
      !Number.isInteger(from) ||
      from < 1 ||
      from > 100000
    )
      return NextResponse.json(
        { error: "Choose a valid submission page." },
        { status: 400 },
      );
    forwarded.count = String(count);
    forwarded.from = String(from);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!allowAuthAttempt(`cf-public:${ip}`, 60, 60000))
    return NextResponse.json(
      { error: "Too many profile requests. Retry in a minute." },
      { status: 429 },
    );
  try {
    return NextResponse.json(
      { status: "OK", result: await codeforces(resource, forwarded) },
      {
        headers: {
          "Cache-Control":
            resource === "contest.list" || resource === "problemset.problems"
              ? "public, s-maxage=3600, stale-while-revalidate=86400"
              : "private, no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ProviderError
            ? error.message
            : "Codeforces is temporarily unavailable.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
