import type { NextRequest } from "next/server";
import handler from "@/../api/auth/signout";
import { runApiHandler } from "@/../server/next-adapter";
export const dynamic = "force-dynamic";
export function POST(request: NextRequest) {
  return runApiHandler(request, handler);
}
