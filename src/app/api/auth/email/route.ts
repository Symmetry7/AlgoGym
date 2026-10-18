import { NextRequest } from "next/server";
import handler from "../../../../../api/auth/email";
import { runApiHandler } from "../../../../../server/next-adapter";
export const POST = (request: NextRequest) => runApiHandler(request, handler);
