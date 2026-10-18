import { NextRequest, NextResponse } from "next/server";
import { problemDetails } from "../../../../server/problem-details";
import { ProviderError } from "../../../../server/providers";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (id.length > 180)
    return NextResponse.json(
      { error: "Choose a valid problem." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await problemDetails(id), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ProviderError
            ? error.message
            : "Problem metadata is temporarily unavailable.",
      },
      {
        status:
          error instanceof ProviderError && error.code === "provider_not_found"
            ? 404
            : 503,
      },
    );
  }
}
