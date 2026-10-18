import { NextRequest } from "next/server";
import handler from "../../../../../api/community-registration";
import { runApiHandler } from "../../../../../server/next-adapter";
export function GET(request: NextRequest) {
  return runApiHandler(request, handler);
}
export function POST(request: NextRequest) {
  return runApiHandler(request, handler);
}
