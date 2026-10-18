import { NextRequest, after } from "next/server";
import handler from "../api-handlers/sync";
import { runApiHandler } from "../next-adapter";
import { processSyncJobs } from "../sync-worker";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const response = await runApiHandler(request, handler);
  if (response.status === 202 && process.env.SUPABASE_SERVICE_ROLE_KEY)
    after(async () => {
      await processSyncJobs(2).catch(() => undefined);
    });
  return response;
}
