import "server-only";
import { adminSupabase } from "./admin";
import { codeforces, ProviderError } from "./providers";
import { parseProblemURL } from "./study-validation";
export async function resolveStudyProblem(url: string) {
  const parsed = parseProblemURL(url);
  const db = adminSupabase();
  const { data: existing, error } = await db
    .from("problems")
    .select("id")
    .eq("provider", parsed.provider)
    .eq("external_problem_id", parsed.id)
    .maybeSingle();
  if (error) throw new Error("The problem directory could not be read.");
  if (existing) return existing.id;
  let problem: {
    title: string;
    cf_rating: number | null;
    lc_difficulty: string | null;
    tags: string[];
  };
  if (parsed.provider === "codeforces") {
    const catalog = await codeforces("problemset.problems");
    const match = catalog.problems?.find(
      (item: any) =>
        item.contestId === parsed.contest && item.index === parsed.index,
    );
    if (!match)
      throw new ProviderError(
        "This Codeforces problem was not found in the public catalog.",
        "provider_not_found",
      );
    problem = {
      title: match.name,
      cf_rating: match.rating ?? null,
      lc_difficulty: null,
      tags: match.tags ?? [],
    };
  } else {
    const response = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        query:
          "query questionMetadata($slug:String!){question(titleSlug:$slug){title difficulty topicTags{name}}}",
        variables: { slug: parsed.id },
      }),
    });
    const body = await response.json();
    const match = body.data?.question;
    if (
      !response.ok ||
      body.errors?.length ||
      !match ||
      !["Easy", "Medium", "Hard"].includes(match.difficulty)
    )
      throw new ProviderError(
        "LeetCode could not return this public problem. Check the URL and retry.",
        "provider_not_found",
      );
    problem = {
      title: match.title,
      cf_rating: null,
      lc_difficulty: match.difficulty,
      tags: match.topicTags.map((tag: any) => tag.name),
    };
  }
  const { data, error: saveError } = await db
    .from("problems")
    .upsert(
      {
        provider: parsed.provider,
        external_problem_id: parsed.id,
        url: parsed.url,
        ...problem,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "provider,external_problem_id" },
    )
    .select("id")
    .single();
  if (saveError) throw new Error("The problem could not be saved.");
  return data.id;
}
