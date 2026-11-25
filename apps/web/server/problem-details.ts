import "server-only";
import { codeforces, ProviderError } from "./providers";
import type { Problem } from "../src/lib/types";
export async function problemDetails(id: string): Promise<Problem> {
  const cf = id.match(/^codeforces-(\d{1,8})([A-Za-z][A-Za-z0-9]{0,7})$/);
  if (cf) {
    const catalog = await codeforces("problemset.problems");
    const row = catalog.problems.find(
      (item: any) => item.contestId === Number(cf[1]) && item.index === cf[2],
    );
    if (!row)
      throw new ProviderError(
        "This problem was not found in the public Codeforces catalog.",
        "provider_not_found",
      );
    const solved = catalog.problemStatistics?.find(
      (item: any) =>
        item.contestId === row.contestId && item.index === row.index,
    )?.solvedCount;
    return {
      id,
      title: row.name,
      platform: "codeforces",
      rating: row.rating,
      difficulty: row.rating?.toString() ?? "Unrated",
      tags: row.tags ?? [],
      url: `https://codeforces.com/problemset/problem/${row.contestId}/${row.index}`,
      contestId: row.contestId,
      problemType: row.index,
      solvedCount: solved,
    };
  }
  const lc = id.match(/^leetcode-([a-z0-9-]{1,160})$/);
  if (!lc)
    throw new ProviderError(
      "Choose a supported problem identifier.",
      "provider_not_found",
    );
  const query = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.json();
    if (!response.ok || body.errors?.length)
      throw new ProviderError(
        "LeetCode problem metadata is temporarily unavailable.",
      );
    return body.data;
  };
  let slug = lc[1];
  if (/^\d+$/.test(slug)) {
    const result = await query(
      'query($search:String!){questionList(categorySlug:"",limit:100,skip:0,filters:{searchKeywords:$search}){data{questionFrontendId titleSlug}}}',
      { search: slug },
    );
    const match = result?.questionList?.data?.find(
      (item: any) => item.questionFrontendId === slug,
    );
    if (!match)
      throw new ProviderError(
        "LeetCode could not find this problem number.",
        "provider_not_found",
      );
    slug = match.titleSlug;
  }
  const data = await query(
    "query($slug:String!){question(titleSlug:$slug){questionFrontendId title titleSlug difficulty topicTags{name}}}",
    { slug },
  );
  const row = data?.question;
  if (!row)
    throw new ProviderError(
      "This public LeetCode problem could not be found.",
      "provider_not_found",
    );
  return {
    id: `leetcode-${/^\d+$/.test(row.questionFrontendId) ? row.questionFrontendId : row.titleSlug}`,
    title: row.title,
    platform: "leetcode",
    difficulty: row.difficulty,
    tags: row.topicTags?.map((tag: any) => tag.name) ?? [],
    url: `https://leetcode.com/problems/${row.titleSlug}/`,
  };
}
