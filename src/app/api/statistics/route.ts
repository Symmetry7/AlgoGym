import { NextRequest } from "next/server";
import handler from "../../../../api/statistics";
import { runApiHandler } from "../../../../server/next-adapter";
export const maxDuration = 60;
export function GET(request: NextRequest) {
  return runApiHandler(request, handler);
}
