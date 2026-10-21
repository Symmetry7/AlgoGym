import { NextRequest } from "next/server";
import handler from "../api-handlers/upsolve";
import { runApiHandler } from "../next-adapter";

export function GET(request: NextRequest) {
  return runApiHandler(request, handler);
}
