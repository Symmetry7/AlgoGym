import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const skip = Number(request.nextUrl.searchParams.get("skip") ?? 0);
  if (!Number.isInteger(skip) || skip < 0 || skip > 20000 || skip % 100 !== 0)
    return NextResponse.json(
      { error: "Choose a supported catalog page." },
      { status: 400 },
    );
  try {
    const response = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query:
          'query publicProblemCatalog($skip:Int,$limit:Int){problemsetQuestionList:questionList(categorySlug:"",skip:$skip,limit:$limit,filters:{}){total:totalNum questions:data{questionFrontendId title titleSlug difficulty topicTags{name slug}}}}',
        variables: { skip, limit: 100 },
      }),
    });
    const body = await response.json();
    const data = body.data?.problemsetQuestionList;
    if (
      !response.ok ||
      body.errors?.length ||
      !Array.isArray(data?.questions) ||
      !Number.isInteger(data.total)
    )
      throw new Error("Unreadable catalog");
    return NextResponse.json(
      { questions: data.questions, total: data.total, skip, limit: 100 },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "LeetCode could not return this catalog page. Retry shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
