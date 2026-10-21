import type { Problem } from "./types";

export const CHAKRA_POLICY_VERSION = "v1-2026-10";
export const CF_REWARDS = [
  [800, 999, 10], [1000, 1199, 15], [1200, 1399, 25], [1400, 1599, 40],
  [1600, 1799, 60], [1800, 1999, 85], [2000, 2199, 115], [2200, 2399, 150],
  [2400, 2599, 190], [2600, 2799, 240], [2800, 2999, 300], [3000, 3199, 375],
  [3200, 3399, 475], [3400, 3500, 600],
] as const;
export function chakraFor(provider: string, difficulty: number | string | undefined): number | null {
  if (provider === "codeforces" && typeof difficulty === "number" && Number.isInteger(difficulty))
    return CF_REWARDS.find(([min, max]) => difficulty >= min && difficulty <= max)?.[2] ?? null;
  if (provider === "leetcode") return ({ Easy: 15, Medium: 45, Hard: 110 } as Record<string, number>)[String(difficulty)] ?? null;
  return null;
}
export const TRAINING_TRACKS = [
  { id: "fundamentals", level: 1, title: "CP Fundamentals", description: "Build confidence with the essentials.", min: 800, max: 1100, tags: [] },
  { id: "implementation", level: 1, title: "Implementation", description: "Turn a clear idea into correct code.", min: 800, max: 1600, tags: ["implementation"] },
  { id: "greedy", level: 2, title: "Greedy Algorithms", description: "Learn when a local choice is enough.", min: 1000, max: 1800, tags: ["greedy"] },
  { id: "binary-search", level: 2, title: "Binary Search", description: "Search the answer space precisely.", min: 1200, max: 2000, tags: ["binary search"] },
  { id: "dynamic-programming", level: 3, title: "Dynamic Programming", description: "Recognize states, transitions, and repeated work.", min: 1200, max: 2400, tags: ["dp"] },
  { id: "graphs-trees", level: 3, title: "Graphs and Trees", description: "Explore structure, paths, and connectivity.", min: 1200, max: 2400, tags: ["graphs", "trees"] },
  { id: "advanced", level: 4, title: "Advanced Problem Solving", description: "Stretch beyond familiar patterns.", min: 2200, max: 2799, tags: [] },
  { id: "expert", level: 5, title: "Expert Competitive Programming", description: "Work through the most demanding rated problems.", min: 2800, max: 3500, tags: [] },
] as const;
export function trackProblems(problems: Problem[], id: string) {
  const track = TRAINING_TRACKS.find((item) => item.id === id);
  if (!track) return [];
  return [...new Map(problems.filter((problem) => problem.platform === "codeforces" && problem.rating !== undefined && problem.rating >= track.min && problem.rating <= track.max && (!track.tags.length || track.tags.some((tag) => problem.tags.includes(tag)))).map((problem) => [problem.id, problem])).values()]
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0) || a.id.localeCompare(b.id)).slice(0, 30);
}
export function secondsRemaining(deadline: number | null, pausedSeconds: number, now = Date.now()) {
  return deadline === null ? Math.max(0, pausedSeconds) : Math.max(0, Math.ceil((deadline - now) / 1000));
}
