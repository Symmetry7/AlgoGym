import "server-only";
import { adminSupabase } from "./admin";

export type Lang = "javascript" | "python" | "cpp" | "java";

export interface WorkspaceProblem {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  isPro: boolean;
  locked: boolean; // Pro problem, visitor without an entitlement
  statement: string; // first paragraph only when locked
  params: { name: string; type: string }[];
  returns: string;
  examples: { input: unknown[]; output: unknown; explain: string | null }[];
  hints: string[];
  hasEditorial: boolean;
  tags: string[];
  starters: Partial<Record<Lang, string>>; // empty when locked
  limits: { timeMs: number; memoryMb: number } | null;
}

/**
 * One Algogym original for the workspace. Read with the service role because statement_md is server-only
 * (DECISIONS.md 2026-11-26). Harness code and hidden tests are never selected here: they stay with the judge.
 * shortcut: everyone is treated as Free until entitlements reach the new app (M18), so Pro problems render locked.
 */
export async function getWorkspaceProblem(slug: string): Promise<WorkspaceProblem | null> {
  const db = adminSupabase();
  const { data: p, error } = await db
    .from("catalog_problems")
    .select("id, slug, title, difficulty, is_pro, statement_md, signature, source, pool")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load the problem: ${error.message}`);
  if (!p || p.source !== "algogym" || p.pool !== "public") return null;
  const locked = p.is_pro;
  const [cases, tags, hints, editorial, langs] = await Promise.all([
    db.from("test_cases").select("position, input, expected_output, explain_md").eq("problem_id", p.id).eq("is_hidden", false).order("position"),
    db.from("problem_tags").select("tags(name)").eq("problem_id", p.id),
    db.from("hints").select("position, body_md").eq("problem_id", p.id).order("position"),
    db.from("editorials").select("problem_id").eq("problem_id", p.id).maybeSingle(),
    db.from("problem_languages").select("lang, starter_code, time_limit_ms, memory_kb").eq("problem_id", p.id),
  ]);
  for (const r of [cases, tags, hints, editorial, langs]) if (r.error) throw new Error(`Could not load the problem: ${r.error.message}`);
  const statement = p.statement_md ?? "";
  const first = langs.data?.[0];
  return {
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    isPro: p.is_pro,
    locked,
    statement: locked ? statement.split(/\n\s*\n/)[0] : statement,
    params: p.signature?.params ?? [],
    returns: p.signature?.returns ?? "",
    examples: locked ? [] : (cases.data ?? []).map((c) => ({ input: c.input, output: c.expected_output, explain: c.explain_md })),
    hints: locked ? [] : (hints.data ?? []).map((h) => h.body_md),
    hasEditorial: Boolean(editorial.data),
    tags: (tags.data ?? []).map((t) => (t.tags as unknown as { name: string } | null)?.name).filter((n): n is string => Boolean(n)),
    starters: locked ? {} : Object.fromEntries((langs.data ?? []).map((l) => [l.lang, l.starter_code])),
    limits: first ? { timeMs: first.time_limit_ms, memoryMb: Math.round(first.memory_kb / 1024) } : null,
  };
}
