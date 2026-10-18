import { NextRequest } from "next/server";
import handler from "../../../../api/onboarding";
import { runApiHandler } from "../../../../server/next-adapter";
export const GET = (request: NextRequest) => runApiHandler(request, handler);
export const PATCH = (request: NextRequest) => runApiHandler(request, handler);
