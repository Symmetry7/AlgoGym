import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processSyncJobs } from "../../sync-worker";
import { adminSupabase } from "../../admin";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (
    !secret ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { data: queued, error } = await adminSupabase().rpc(
      "enqueue_due_profile_syncs",
      { p_limit: 100 },
    );
    if (error) throw error;
    return NextResponse.json(
      { queued, ...(await processSyncJobs(3)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The synchronization worker is temporarily unavailable." },
      { status: 503 },
    );
  }
}
export const POST = GET;
