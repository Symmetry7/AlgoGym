import { SiCodechef, SiCodeforces, SiGeeksforgeeks, SiGithub, SiLeetcode } from "react-icons/si";
import { cn } from "@/lib/utils";

export const codingProviders = [
  { id: "codeforces", name: "Codeforces", available: true },
  { id: "leetcode", name: "LeetCode", available: true },
  { id: "codechef", name: "CodeChef", available: true },
  { id: "atcoder", name: "AtCoder", available: true },
  { id: "github", name: "GitHub", available: true },
  { id: "geeksforgeeks", name: "GeeksforGeeks", available: true },
] as const;

export type ProviderId = (typeof codingProviders)[number]["id"];

/** Brand marks are decorative beside a provider's visible name. */
export function CodingPlatformMark({ platform, className }: { platform: ProviderId; className?: string }) {
  const icons = { codeforces: SiCodeforces, leetcode: SiLeetcode, codechef: SiCodechef, github: SiGithub, geeksforgeeks: SiGeeksforgeeks };
  const colors = { codeforces: "bg-sky-500/10 text-sky-400", leetcode: "bg-amber-500/10 text-amber-400", codechef: "bg-orange-300/10 text-orange-200", atcoder: "bg-muted text-foreground", github: "bg-muted text-foreground", geeksforgeeks: "bg-emerald-500/10 text-emerald-400" };
  const Icon = platform === "atcoder" ? null : icons[platform];
  return <span aria-hidden="true" className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", colors[platform], className)}>{Icon ? <Icon className="size-[22px]" /> : <span className="text-sm font-semibold tracking-tight">At</span>}</span>;
}
