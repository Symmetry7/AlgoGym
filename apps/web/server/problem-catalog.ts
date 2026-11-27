import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CatalogProblem, Difficulty, Source } from "@/lib/problem-catalog";
import { getSupabaseEnv } from "./supabase";

export interface CatalogData {
  problems: CatalogProblem[];
  tags: Record<string, string>; // slug -> name
  companies: { slug: string; name: string; problems: number }[]; // most problems first
}

const TTL_MS = 10 * 60 * 1000;
let cached: { at: number; data: Promise<CatalogData> } | null = null;

// Every row of a public table, 1000 per request (the API's row cap), in a stable order.
async function readAll<T>(db: SupabaseClient, table: string, columns: string, order: string, where?: [string, string]) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(columns).order(order).range(from, from + 999);
    if (where) q = q.eq(where[0], where[1]);
    const { data, error } = await q;
    if (error) throw new Error(`Could not load ${table}: ${error.message}`);
    rows.push(...(data as T[]));
    if (data.length < 1000) return rows;
  }
}

async function load(): Promise<CatalogData> {
  const { url, key } = getSupabaseEnv();
  const db = createClient(url, key, { auth: { persistSession: false } });
  type P = { id: string; slug: string; title: string; difficulty: Difficulty; source: Source; source_url: string | null; is_pro: boolean };
  const [problems, tags, problemTags, similar, companies, links] = await Promise.all([
    readAll<P>(db, "catalog_problems", "id, slug, title, difficulty, source, source_url, is_pro", "slug"),
    readAll<{ id: string; slug: string; name: string }>(db, "tags", "id, slug, name", "slug"),
    readAll<{ problem_id: string; tag_id: string }>(db, "problem_tags", "problem_id, tag_id", "problem_id"),
    readAll<{ original_id: string; similar_id: string }>(db, "problem_similar", "original_id, similar_id", "similar_id"),
    readAll<{ id: string; slug: string; name: string }>(db, "companies", "id, slug, name", "slug"),
    // Free visitors can read all-time frequencies only (30/90-day rows need Pro, DECISIONS.md 2026-11-26).
    readAll<{ problem_id: string; company_id: string; frequency: number }>(db, "problem_companies", "problem_id, company_id, frequency", "problem_id", ["timeframe", "all"]),
  ]);
  const byId = new Map(problems.map((p) => [p.id, p]));
  const tagSlug = new Map(tags.map((t) => [t.id, t.slug]));
  const companySlug = new Map(companies.map((c) => [c.id, c.slug]));
  const tagsOf = new Map<string, string[]>();
  for (const pt of problemTags) tagsOf.set(pt.problem_id, [...(tagsOf.get(pt.problem_id) ?? []), tagSlug.get(pt.tag_id)!].filter(Boolean));
  const similarOf = new Map<string, { slug: string; title: string }>();
  for (const s of similar) {
    const o = byId.get(s.original_id);
    if (o && !similarOf.has(s.similar_id)) similarOf.set(s.similar_id, { slug: o.slug, title: o.title });
  }
  const freq = new Map<string, Record<string, number>>();
  const perCompany = new Map<string, number>();
  for (const l of links) {
    const c = companySlug.get(l.company_id);
    if (!c) continue;
    freq.set(l.problem_id, { ...(freq.get(l.problem_id) ?? {}), [c]: Number(l.frequency) });
    perCompany.set(c, (perCompany.get(c) ?? 0) + 1);
  }
  return {
    problems: problems.map((p) => {
      const frequency = freq.get(p.id) ?? {};
      return {
        id: p.id, slug: p.slug, title: p.title, difficulty: p.difficulty, source: p.source, sourceUrl: p.source_url, isPro: p.is_pro,
        tags: tagsOf.get(p.id) ?? [], similar: similarOf.get(p.id) ?? null, companyCount: Object.keys(frequency).length, frequency,
      };
    }),
    tags: Object.fromEntries(tags.map((t) => [t.slug, t.name])),
    companies: companies
      .map((c) => ({ slug: c.slug, name: c.name, problems: perCompany.get(c.slug) ?? 0 }))
      .sort((a, b) => b.problems - a.problems || a.name.localeCompare(b.name)),
  };
}

/** The whole public catalog (~3,200 rows), cached in memory for 10 minutes. A failed load is not cached. */
export function getCatalog(): Promise<CatalogData> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  const data = load();
  cached = { at: Date.now(), data };
  data.catch(() => { cached = null; });
  return data;
}
