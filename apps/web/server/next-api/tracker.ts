import { NextRequest, after } from "next/server";
import handler from "../api-handlers/tracker";
import { runApiHandler } from "../next-adapter";
import { processSyncJobs } from "../sync-worker";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const response = await runApiHandler(request, handler);
  if (response.ok && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const data = await response.clone().json();
    if (
      data.jobs?.some((job: { status: string }) =>
        ["queued", "retrying"].includes(job.status),
      )
    )
      after(async () => {
        await processSyncJobs(1).catch(() => undefined);
      });
  }
  return response;
}
