import "server-only";
import { adminSupabase } from "./admin";

export interface ProblemPage {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  isPro: boolean;
  statement: string; // the first paragraph only, when the problem is Pro (locked)
  locked: boolean;
  params: string[];
  examples: { input: unknown[]; output: unknown; explain: string | null }[];
  tags: string[];
}

/**
 * One Algogym original for /problems/[slug]. Read with the service role because statement_md is server-only
 * (DECISIONS.md 2026-11-26); Pro statements are cut to their first paragraph here, never in the browser.
 * shortcut: everyone is treated as Free until accounts and entitlements reach the new app (M18).
 */
export async function getProblemPage(slug: string): Promise<ProblemPage | null> {
  const db = adminSupabase();
  const { data: p, error } = await db
    .from("catalog_problems")
    .select("id, slug, title, difficulty, is_pro, statement_md, signature, source, pool")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load the problem: ${error.message}`);
  if (!p || p.source !== "algogym" || p.pool !== "public") return null;
  const [cases, tags] = await Promise.all([
    db.from("test_cases").select("position, input, expected_output, explain_md").eq("problem_id", p.id).eq("is_hidden", false).order("position"),
    db.from("problem_tags").select("tags(name)").eq("problem_id", p.id),
  ]);
  if (cases.error) throw new Error(`Could not load examples: ${cases.error.message}`);
  const locked = p.is_pro;
  const statement = p.statement_md ?? "";
  return {
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    isPro: p.is_pro,
    locked,
    statement: locked ? statement.split(/\n\s*\n/)[0] : statement,
    params: (p.signature?.params ?? []).map((x: { name: string }) => x.name),
    examples: locked ? [] : cases.data.map((c) => ({ input: c.input, output: c.expected_output, explain: c.explain_md })),
    tags: (tags.data ?? []).map((t) => (t.tags as unknown as { name: string } | null)?.name).filter((n): n is string => Boolean(n)),
  };
}
