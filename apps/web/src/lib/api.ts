import type { LeetCodeProblem, CodeforcesProblem, Problem } from "./types";
import { detectContestTypeFromName } from "./contest-detector";

async function readJson(path: string) {
  const response = await fetch(path, { signal: AbortSignal.timeout(30_000) });
  const payload = await response.json();
  if (!response.ok || payload.status === "FAILED") throw new Error(payload.error || payload.comment || "The provider could not return its catalog.");
  return payload;
}

export async function fetchLeetCodeProblems(): Promise<LeetCodeProblem[]> {
  const data = await readJson("/api/providers/leetcode/problems?skip=0");
  if (!Number.isInteger(data.total) || data.total > 20000) throw new Error('LeetCode catalog size is unavailable or requires a larger supported import.');
  const questions = [...(data.questions ?? [])];
  for (let skip=100;skip<data.total;skip+=400) {
    const pages=await Promise.all(Array.from({length:Math.min(4,Math.ceil((data.total-skip)/100))},(_,index)=>readJson(`/api/providers/leetcode/problems?skip=${skip+index*100}`)));
    for(const page of pages){if(!Array.isArray(page.questions)||page.questions.length===0)throw new Error('LeetCode returned an incomplete catalog. Retry shortly.');questions.push(...page.questions);}
  }
  data.questions = [...new Map(questions.map((question)=>[question.titleSlug,question])).values()];
  if(data.questions.length<data.total)throw new Error('LeetCode returned an incomplete catalog. Retry shortly.');
  return (data.questions ?? []).filter((item: { titleSlug?: string; questionFrontendId?: string }) => item.titleSlug && item.questionFrontendId).map((item: { questionFrontendId: string; title: string; titleSlug: string; difficulty: "Easy" | "Medium" | "Hard"; topicTags?: { name: string }[] }) => ({
    ID: Number(item.questionFrontendId), TitleSlug: item.titleSlug, Title: item.title, Difficulty: item.difficulty, Tags: (item.topicTags ?? []).map((tag) => tag.name),
  }));
}

export async function fetchCodeforcesProblems() {
  const [catalog, contests] = await Promise.all([
    readJson("/api/providers/codeforces?resource=problemset.problems"),
    readJson("/api/providers/codeforces?resource=contest.list").catch(() => ({ result: [] })),
  ]);
  const contestNames = new Map<number, string>(); const contestStarts = new Map<number, number>();
  for (const contest of contests.result ?? []) { contestNames.set(contest.id, contest.name); if (contest.startTimeSeconds) contestStarts.set(contest.id, contest.startTimeSeconds); }
  const counts = new Map<string, number>((catalog.result?.problemStatistics ?? []).map((item: { contestId: number; index: string; solvedCount: number }) => [`${item.contestId}:${item.index}`, item.solvedCount]));
  const problems: CodeforcesProblem[] = (catalog.result?.problems ?? []).filter((item: CodeforcesProblem) => Number.isInteger(item.contestId) && /^[A-Za-z0-9]+$/.test(item.index)).map((item: CodeforcesProblem) => ({ ...item, solvedCount: counts.get(`${item.contestId}:${item.index}`) }));
  return { problems, contestNames, contestStarts };
}

export function convertLeetCodeProblem(problem: LeetCodeProblem): Problem {
  return { id: `leetcode-${problem.ID || problem.TitleSlug}`, title: problem.Title || problem.TitleSlug, platform: "leetcode", difficulty: problem.Difficulty, tags: problem.Tags ?? [], url: `https://leetcode.com/problems/${encodeURIComponent(problem.TitleSlug)}/` };
}
export function convertCodeforcesProblem(problem: CodeforcesProblem, contestName?: string, startTime?: number): Problem {
  return { id: `codeforces-${problem.contestId}${problem.index}`, title: problem.name, platform: "codeforces", difficulty: problem.rating?.toString() ?? "Unrated", rating: problem.rating, tags: [...new Set(problem.tags ?? [])], url: `https://codeforces.com/problemset/problem/${problem.contestId}/${encodeURIComponent(problem.index)}`, solvedCount: problem.solvedCount, contestId: problem.contestId, contestName, contestType: contestName ? detectContestTypeFromName(contestName) : undefined, problemType: problem.index, contestEra: startTime ? new Date(startTime * 1000).getUTCFullYear() >= 2022 ? "new" : "old" : undefined };
}
let cache: { at: number; problems: Problem[] } | null = null;
let inFlight: Promise<Problem[]> | null = null;
let catalogWarnings:string[]=[];
export function getCatalogWarnings(){return [...catalogWarnings];}
export async function fetchAllProblems(force=false): Promise<Problem[]> {
  if (!force && cache && Date.now() - cache.at < 5 * 60_000) return cache.problems;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const [cf, lc] = await Promise.allSettled([fetchCodeforcesProblems(), fetchLeetCodeProblems()]);
    catalogWarnings=[...(cf.status==='rejected'?['Codeforces catalog could not load. Other available providers are shown; retry to restore it.']:[]),...(lc.status==='rejected'?['LeetCode catalog could not load completely. Other available providers are shown; retry to restore it.']:[])];
    const problems = [...(cf.status === "fulfilled" ? cf.value.problems.map((item) => convertCodeforcesProblem(item, cf.value.contestNames.get(item.contestId), cf.value.contestStarts.get(item.contestId))) : []), ...(lc.status === "fulfilled" ? lc.value.map(convertLeetCodeProblem) : [])];
    if (!problems.length) throw new Error("The problem catalogs are temporarily unavailable. Please retry shortly.");
    cache = { at: Date.now(), problems }; return problems;
  })();
  try { return await inFlight; } finally { inFlight = null; }
}
export function extractTags(problems: Problem[]) { return [...new Set(problems.flatMap((problem) => problem.tags))].sort(); }
