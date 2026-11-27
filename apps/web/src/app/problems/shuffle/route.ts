import { NextResponse } from "next/server";
import { getCatalog } from "../../../../server/problem-catalog";

export const dynamic = "force-dynamic";

/** Shuffle: a random free Algogym original (solved-state filtering arrives with submissions in M11). */
export async function GET(request: Request) {
  const { problems } = await getCatalog();
  const pool = problems.filter((p) => p.source === "algogym" && !p.isPro);
  const target = pool.length ? `/problems/${pool[Math.floor(Math.random() * pool.length)].slug}` : "/problems";
  return NextResponse.redirect(new URL(target, request.url), 307);
}
