export type CodeforcesContestProblem = {
  key: string;
  contestId: number;
  index: string;
  name: string;
  type: string;
  rating: number | null;
  tags: string[];
  solvedCount: number | null;
  url: string;
};

export function parseCodeforcesProblem(input: string) {
  const value = input.trim();
  const id = /^(\d{1,8})\s*([A-Za-z][A-Za-z0-9]{0,7})$/.exec(value);
  if (id) return { contestId: Number(id[1]), index: id[2].toUpperCase() };
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Enter a Codeforces ID such as 4A or a problem URL."); }
  if (url.protocol !== "https:" || !["codeforces.com", "www.codeforces.com"].includes(url.hostname))
    throw new Error("Use a public HTTPS Codeforces problem URL.");
  const match = /^\/(?:problemset\/problem|contest|gym)\/(\d{1,8})\/(?:problem\/)?([A-Za-z][A-Za-z0-9]{0,7})\/?$/.exec(url.pathname);
  if (!match) throw new Error("This Codeforces URL does not identify one problem.");
  return { contestId: Number(match[1]), index: match[2].toUpperCase() };
}

export function codeforcesProblemKey(contestId: number, index: string) {
  return `${contestId}${index.toUpperCase()}`;
}

export async function codeforcesContestCatalog(): Promise<CodeforcesContestProblem[]> {
  const { codeforces } = await import("./providers");
  const result = await codeforces("problemset.problems", { lang: "en" });
  if (!Array.isArray(result?.problems)) throw new Error("Codeforces problem catalog is unavailable.");
  const stats = new Map<string, number>();
  for (const item of Array.isArray(result.problemStatistics) ? result.problemStatistics : []) {
    if (Number.isInteger(item.contestId) && typeof item.index === "string" && Number.isInteger(item.solvedCount))
      stats.set(codeforcesProblemKey(item.contestId, item.index), item.solvedCount);
  }
  return result.problems.flatMap((item: Record<string, unknown>) => {
    const contestId = item.contestId;
    const index = item.index;
    if (!Number.isInteger(contestId) || typeof index !== "string" || !/^[A-Za-z][A-Za-z0-9]{0,7}$/.test(index) || typeof item.name !== "string") return [];
    const key = codeforcesProblemKey(contestId as number, index);
    return [{ key, contestId: contestId as number, index, name: item.name, type: typeof item.type === "string" ? item.type : "PROGRAMMING", rating: Number.isInteger(item.rating) ? item.rating as number : null, tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : [], solvedCount: stats.get(key) ?? null, url: `https://codeforces.com/problemset/problem/${contestId}/${index}` }];
  });
}

export async function resolveCodeforcesContestProblem(input: string) {
  const identity = parseCodeforcesProblem(input);
  const match = (await codeforcesContestCatalog()).find(item => item.contestId === identity.contestId && item.index.toUpperCase() === identity.index);
  if (!match) throw new Error(`Codeforces problem ${codeforcesProblemKey(identity.contestId, identity.index)} was not found in the public catalog.`);
  return match;
}
