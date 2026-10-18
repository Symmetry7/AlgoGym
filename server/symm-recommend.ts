import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const CF_TAGS = new Set([
  "implementation",
  "math",
  "greedy",
  "dp",
  "data structures",
  "brute force",
  "constructive algorithms",
  "graphs",
  "sortings",
  "binary search",
  "dfs and similar",
  "trees",
  "strings",
  "number theory",
  "combinatorics",
  "geometry",
  "shortest paths",
  "two pointers",
  "bitmasks",
  "dsu",
  "flows",
  "games",
  "probabilities",
  "hashing",
  "divide and conquer",
]);
export function validTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.toLowerCase().trim()))].filter(
    (tag) => CF_TAGS.has(tag),
  );
}
export function inferredTags(topic: string) {
  const value = topic.toLowerCase();
  const patterns: Array<[RegExp, string]> = [
    [/dynamic programming|\bdp\b|memoization|tabulation|knapsack/, "dp"],
    [/graph|traversal|\bbfs\b|\bdfs\b/, "graphs"],
    [/shortest path|dijkstra|bellman/, "shortest paths"],
    [/binary search|bisect/, "binary search"],
    [/greedy/, "greedy"],
    [/tree|lca|segment tree/, "trees"],
    [/number theory|prime|modular|gcd/, "number theory"],
    [/string|pattern matching|kmp/, "strings"],
    [/sort/, "sortings"],
    [/data structure|stack|queue|heap/, "data structures"],
    [/math|combinatorics/, "math"],
    [/implementation|simulation/, "implementation"],
  ];
  return patterns
    .filter(([pattern]) => pattern.test(value))
    .map(([, tag]) => tag);
}

type CfProblem = {
  contestId?: number;
  index?: string;
  name?: string;
  rating?: number;
  tags?: string[];
};
let cached: { at: number; problems: CfProblem[] } | null = null;
async function catalog() {
  if (cached && Date.now() - cached.at < 15 * 60_000) return cached.problems;
  const response = await fetch(
    "https://codeforces.com/api/problemset.problems",
    { cache: "no-store", signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok)
    throw new Error("Codeforces catalog is temporarily unavailable.");
  const body = await response.json();
  if (body.status !== "OK" || !Array.isArray(body.result?.problems))
    throw new Error("Codeforces catalog is temporarily unavailable.");
  cached = { at: Date.now(), problems: body.result.problems };
  return cached.problems;
}
export async function recommendProblems(
  admin: SupabaseClient,
  moduleId: string,
  tags: string[],
  level: string,
  moduleTitle = "",
  pathTopic = "",
) {
  const selectedTags = validTags(tags).length
    ? validTags(tags)
    : inferredTags(moduleTitle).length
      ? inferredTags(moduleTitle)
      : inferredTags(pathTopic);
  if (!selectedTags.length) return [];
  const range =
    level === "beginner"
      ? [800, 1300]
      : level === "intermediate"
        ? [1200, 2000]
        : [1800, 2800];
  const queries = await Promise.all(
    selectedTags.map((tag) =>
      admin
        .from("problems")
        .select(
          "id,provider,external_problem_id,title,url,cf_rating,lc_difficulty,tags",
        )
        .eq("active", true)
        .contains("tags", [tag])
        .limit(30),
    ),
  );
  for (const result of queries) if (result.error) throw result.error;
  let rows = queries
    .flatMap((result) => result.data ?? [])
    .filter(
      (p) =>
        p.provider === "leetcode" ||
        (p.cf_rating >= range[0] && p.cf_rating <= range[1]),
    );
  if (rows.length < 3) {
    const remote = await catalog();
    const matches = remote
      .filter(
        (p) =>
          p.contestId &&
          p.index &&
          p.name &&
          p.rating &&
          p.rating >= range[0] &&
          p.rating <= range[1] &&
          p.tags?.some((tag) => selectedTags.includes(tag.toLowerCase())),
      )
      .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
      .slice(0, 8);
    if (matches.length) {
      const payload = matches.map((p) => ({
        provider: "codeforces",
        external_problem_id: `${p.contestId}${p.index}`,
        title: p.name!,
        url: `https://codeforces.com/problemset/problem/${p.contestId}/${encodeURIComponent(p.index!)}`,
        cf_rating: p.rating,
        tags: p.tags ?? [],
        active: true,
        last_synced_at: new Date().toISOString(),
      }));
      const saved = await admin
        .from("problems")
        .upsert(payload, { onConflict: "provider,external_problem_id" })
        .select(
          "id,provider,external_problem_id,title,url,cf_rating,lc_difficulty,tags",
        );
      if (saved.error) throw saved.error;
      rows = [...rows, ...(saved.data ?? [])];
    }
  }
  const unique = [...new Map(rows.map((p) => [p.id, p])).values()]
    .sort((a, b) => (a.cf_rating ?? 1800) - (b.cf_rating ?? 1800))
    .slice(0, 6);
  if (unique.length) {
    const linked = await admin.from("ai_recommended_problems").upsert(
      unique.map((p, index) => ({
        module_id: moduleId,
        problem_id: p.id,
        position: index,
      })),
      { onConflict: "module_id,problem_id" },
    );
    if (linked.error) throw linked.error;
  }
  return unique;
}
