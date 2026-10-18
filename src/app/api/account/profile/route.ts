import type { NextRequest } from "next/server";
import handler from "@/../api/account-profile";
import { runApiHandler } from "@/../server/next-adapter";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  return runApiHandler(request, handler);
}
export function PATCH(request: NextRequest) {
  return runApiHandler(request, handler);
}
