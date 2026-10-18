import { NextRequest } from "next/server";
import handler from "../api-handlers/colleges";
import { runApiHandler } from "../next-adapter";
export const GET = (request: NextRequest) => runApiHandler(request, handler);
export const POST = (request: NextRequest) => runApiHandler(request, handler);
