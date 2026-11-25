import { NextRequest } from "next/server";
import handler from "../api-handlers/onboarding";
import { runApiHandler } from "../next-adapter";
export const GET = (request: NextRequest) => runApiHandler(request, handler);
export const PATCH = (request: NextRequest) => runApiHandler(request, handler);
