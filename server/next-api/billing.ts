import type { NextRequest } from "next/server";
import handler from "../api-handlers/billing";
import { runApiHandler } from "../next-adapter";
export const dynamic="force-dynamic";
export function GET(request:NextRequest){return runApiHandler(request,handler);}
export function POST(request:NextRequest){return runApiHandler(request,handler);}
