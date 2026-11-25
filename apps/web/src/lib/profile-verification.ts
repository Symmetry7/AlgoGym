export type CodingPlatform = "codeforces" | "leetcode" | "codechef" | "atcoder" | "github" | "geeksforgeeks";
export interface VerifiedProfile {
  platform: CodingPlatform;
  username: string;
  verified_at: string;
}
export function codingProfileUrl(platform: CodingPlatform, username: string) {
  const roots: Record<CodingPlatform, string> = { codeforces: "https://codeforces.com/profile/", leetcode: "https://leetcode.com/u/", atcoder: "https://atcoder.jp/users/", codechef: "https://www.codechef.com/users/", github: "https://github.com/", geeksforgeeks: "https://www.geeksforgeeks.org/profile/" };
  return roots[platform] + encodeURIComponent(username);
}
export interface VerificationStatus {
  profiles: VerifiedProfile[];
  challenges: Array<{ platform: CodingPlatform; username: string; expires_at: string }>;
  onboardingCompleted: boolean;
}

export async function profileVerificationRequest<T>(body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/profile-verification", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("The verification service could not be reached. Please retry.");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Verification could not be completed. Please retry.");
  return result as T;
}
