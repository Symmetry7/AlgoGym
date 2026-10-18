import type { NextRequest } from "next/server";
import handler from "@/../server/api-handlers/profile-verification";
import { runApiHandler } from "@/../server/next-adapter";
export const dynamic = "force-dynamic";
export function POST(request: NextRequest) {
  return runApiHandler(request, handler);
}
