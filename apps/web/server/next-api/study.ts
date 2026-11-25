import { NextRequest } from "next/server";
import handler from "../api-handlers/study";
import { runApiHandler } from "../next-adapter";
export const maxDuration = 60;
export function GET(request: NextRequest) {
  return runApiHandler(request, handler);
}
export function POST(request: NextRequest) {
  return runApiHandler(request, handler);
}
