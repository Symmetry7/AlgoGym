import { NextResponse } from "next/server";
import { currentUser } from "../../../../../server/session";

export const dynamic = "force-dynamic";

/** GET /api/judge/[id]: the polling fallback. Reads as the visitor, so RLS returns only their own submission. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { db, user } = await currentUser();
  if (!db || !user) return NextResponse.json({ error: "Sign in to see this result." }, { status: 401 });
  const { data, error } = await db.from("submissions").select("id, mode, status, verdict, results, runtime_ms, created_at").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "Couldn't load the result." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
