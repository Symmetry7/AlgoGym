import type { NextRequest } from "next/server";
import handler from "@/../api/leaderboards";
import { runApiHandler } from "@/../server/next-adapter";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  return runApiHandler(request, handler);
}
