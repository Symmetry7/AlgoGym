import "server-only";
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly code = "provider_unavailable",
  ) {
    super(message);
  }
}
let cfQueue: Promise<unknown> = Promise.resolve();
let lastCF = 0;
export async function codeforces(
  resource:
    | "user.info"
    | "user.status"
    | "user.rating"
    | "contest.list"
    | "problemset.problems"
    | "contest.standings",
  params: Record<string, string> = {},
  fresh = false,
): Promise<any> {
  const run = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const delay = 2100 - (Date.now() - lastCF);
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      lastCF = Date.now();
      try {
        const response = await fetch(
          `https://codeforces.com/api/${resource}?${new URLSearchParams(params)}`,
          {
            ...(fresh
              ? { cache: "no-store" as const }
              : {
                  next: {
                    revalidate:
                      resource === "contest.list" ||
                      resource === "problemset.problems"
                        ? 3600
                        : 60,
                  },
                }),
            signal: AbortSignal.timeout(12_000),
            headers: {
              Accept: "application/json",
              "User-Agent": "AlgoGym/2.0 public profile synchronization",
            },
          },
        );
        const data = await response.json();
        if (
          response.status === 429 ||
          response.status >= 500 ||
          (data.status === "FAILED" &&
            /limit|temporar|call limit/i.test(data.comment ?? ""))
        ) {
          if (attempt < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1500 * 2 ** attempt),
            );
            continue;
          }
          throw new ProviderError(
            "Codeforces is busy. Your sync will retry shortly.",
            "provider_rate_limit",
          );
        }
        if (!response.ok || data.status !== "OK")
          throw new ProviderError(
            "Codeforces could not return this public profile or resource.",
            "provider_not_found",
          );
        return data.result;
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        if (attempt === 2)
          throw new ProviderError(
            "Codeforces is temporarily unavailable. Your last synchronized data is preserved.",
          );
      }
    }
    throw new ProviderError("Codeforces is temporarily unavailable.");
  };
  const result = cfQueue.then(run, run);
  cfQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
export async function leetcodeProfile(username: string) {
  const response = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AlgoGym/2.0 public profile synchronization",
    },
    body: JSON.stringify({
      query:
        "query publicProfile($username:String!){matchedUser(username:$username){username profile{userAvatar} submitStats:submitStatsGlobal{acSubmissionNum{difficulty count}}} userContestRanking(username:$username){rating attendedContestsCount globalRanking} userContestRankingHistory(username:$username){attended rating contest{title startTime}}}",
      variables: { username },
    }),
  });
  if (!response.ok)
    throw new ProviderError(
      "LeetCode is temporarily unavailable. Your last synchronized data is preserved.",
      response.status === 429 ? "provider_rate_limit" : "provider_unavailable",
    );
  const body = await response.json();
  if (body.errors?.length || !body.data?.matchedUser)
    throw new ProviderError(
      "LeetCode did not return readable public profile statistics.",
    );
  const data = body.data;
  const counts = data.matchedUser.submitStats?.acSubmissionNum;
  if (!Array.isArray(counts))
    throw new ProviderError(
      "LeetCode's public difficulty counts are unavailable.",
    );
  const count = (difficulty: string) => {
    const item = counts.find(
      (value: { difficulty: string; count: number }) =>
        value.difficulty === difficulty,
    );
    return typeof item?.count === "number" ? item.count : null;
  };
  return {
    profile: {
      username: data.matchedUser.username,
      avatar: data.matchedUser.profile?.userAvatar ?? null,
    },
    summary: {
      totalSolved: count("All"),
      easySolved: count("Easy"),
      mediumSolved: count("Medium"),
      hardSolved: count("Hard"),
      rating: data.userContestRanking?.rating ?? null,
      ratedContests: data.userContestRanking?.attendedContestsCount ?? null,
      reportedTotals: true,
    },
    ratings: Array.isArray(data.userContestRankingHistory)
      ? data.userContestRankingHistory.filter(
          (item: any) =>
            item.attended &&
            typeof item.rating === "number" &&
            item.contest?.startTime,
        )
      : [],
  };
}
