import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Only server-confirmed problem identities can produce a solved indicator.
export function isProblemSolved(
  problemId: string,
  platform: "leetcode" | "codeforces",
  leetcodeHandle?: string,
  codeforcesHandle?: string,
  verifiedProblemIds: readonly string[] = [],
): boolean {
  void platform; void leetcodeHandle; void codeforcesHandle;
  return verifiedProblemIds.includes(problemId);
}
