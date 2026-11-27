import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createSubmission, JudgeRequestError, LANGS, MAX_CUSTOM_CASES, processSubmission } from "../../../../server/judge";
import { currentUser } from "../../../../server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Judging runs after the response (next/server `after`), inside this function's time limit.
export const maxDuration = 60;

const Body = z.object({
  slug: z.string().min(1).max(120),
  lang: z.enum(LANGS),
  code: z.string().max(70_000),
  mode: z.enum(["run", "submit"]),
  custom: z.array(z.array(z.unknown())).max(MAX_CUSTOM_CASES).optional(),
}).strict();

/** POST /api/judge: queue a Run or Submit for the signed-in user. Responds 202 { id, token } at once. */
export async function POST(request: Request) {
  const { db, user } = await currentUser();
  if (!db || !user) return NextResponse.json({ error: "Sign in to run your code." }, { status: 401 });
  let body: Parameters<typeof createSubmission>[1];
  try {
    body = Body.parse(await request.json()) as Parameters<typeof createSubmission>[1]; // parse guarantees every field
  } catch {
    return NextResponse.json({ error: "That request wasn't valid." }, { status: 400 });
  }
  try {
    const id = await createSubmission(user.id, body);
    after(() => processSubmission(id));
    // The browser has no Supabase session of its own (cookies are httpOnly); this token lets it subscribe to its own
    // submission over Realtime, where the owner-only SELECT policy still applies.
    const { data } = await db.auth.getSession();
    return NextResponse.json({ id, token: data.session?.access_token ?? null }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof JudgeRequestError) {
      return NextResponse.json({ error: error.message, retryAfter: error.retryAfter }, { status: error.status, headers: error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {} });
    }
    console.error(JSON.stringify({ event: "judge.create_failed", message: error instanceof Error ? error.message : String(error) }));
    return NextResponse.json({ error: "Couldn't start the run. Your code is saved; try again." }, { status: 500 });
  }
}
