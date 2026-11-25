import { NextRequest } from "next/server";
import handler from "../../api-handlers/auth/email";
import { runApiHandler } from "../../next-adapter";
export const POST = (request: NextRequest) => runApiHandler(request, handler);
