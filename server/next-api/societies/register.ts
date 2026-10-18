import { NextRequest } from "next/server";
import handler from "../../api-handlers/community-registration";
import { runApiHandler } from "../../next-adapter";
export function GET(request: NextRequest) {
  return runApiHandler(request, handler);
}
export function POST(request: NextRequest) {
  return runApiHandler(request, handler);
}
