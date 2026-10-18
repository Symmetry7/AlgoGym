import { NextRequest } from "next/server";
import handler from "../../../../api/colleges";
import { runApiHandler } from "../../../../server/next-adapter";
export const GET = (request: NextRequest) => runApiHandler(request, handler);
export const POST = (request: NextRequest) => runApiHandler(request, handler);
