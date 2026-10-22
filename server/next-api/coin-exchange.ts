import type { NextRequest } from "next/server";
import handler from "../api-handlers/coin-exchange";
import { runApiHandler } from "../next-adapter";
export const dynamic = "force-dynamic";
export function POST(request: NextRequest) { return runApiHandler(request, handler); }
