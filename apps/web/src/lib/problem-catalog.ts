// The /problems list: Algogym originals plus metadata-only LeetCode rows (M7). Pure functions, so they're unit-tested.

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Source = "algogym" | "leetcode" | "gfg";

export interface CatalogProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  source: Source;
  sourceUrl: string | null;
  isPro: boolean;
  tags: string[]; // tag slugs (originals only for now)
  similar: { slug: string; title: string } | null; // the Algogym original for a metadata row
  companyCount: number; // companies whose all-time list includes it
  frequency: Record<string, number>; // company slug -> all-time frequency (0-100)
}

export interface CatalogFilters {
  q?: string;
  difficulty?: Difficulty;
  source?: "algogym" | "external";
  company?: string;
  tag?: string;
  access?: "free" | "pro";
  status?: "solved" | "unsolved";
  list?: string; // "favorites" or a list id
  sort: "default" | "title" | "difficulty" | "frequency";
  page: number;
}

export const PAGE_SIZE = 50;
const DIFFICULTY_RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

export function parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  const one = (k: string) => {
    const v = params[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    return s ? s.slice(0, 120) : undefined;
  };
  const pick = <T extends string>(v: string | undefined, allowed: readonly T[]) => (allowed.includes(v as T) ? (v as T) : undefined);
  const page = Number.parseInt(one("page") ?? "1", 10);
  return {
    q: one("q"),
    difficulty: pick(one("difficulty"), ["Easy", "Medium", "Hard"] as const),
    source: pick(one("source"), ["algogym", "external"] as const),
    company: one("company"),
    tag: one("tag"),
    access: pick(one("access"), ["free", "pro"] as const),
    status: pick(one("status"), ["solved", "unsolved"] as const),
    list: one("list"),
    sort: pick(one("sort"), ["default", "title", "difficulty", "frequency"] as const) ?? "default",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Filter, sort and paginate. Default order: Algogym originals first, then rows asked by the most companies. */
export function queryCatalog(all: CatalogProblem[], f: CatalogFilters, ctx: { solved?: Set<string>; only?: Set<string> } = {}) {
  const solved = ctx.solved ?? new Set<string>();
  const q = f.q?.toLowerCase();
  const rows = all.filter(
    (p) =>
      (!q || p.title.toLowerCase().includes(q)) &&
      (!f.difficulty || p.difficulty === f.difficulty) &&
      (!f.source || (f.source === "algogym" ? p.source === "algogym" : p.source !== "algogym")) &&
      (!f.company || f.company in p.frequency) &&
      (!f.tag || p.tags.includes(f.tag)) &&
      (!f.access || (f.access === "pro") === p.isPro) &&
      (!f.status || (f.status === "solved") === solved.has(p.id)) &&
      (!ctx.only || ctx.only.has(p.id)),
  );
  const byTitle = (a: CatalogProblem, b: CatalogProblem) => a.title.localeCompare(b.title);
  const sorters: Record<CatalogFilters["sort"], (a: CatalogProblem, b: CatalogProblem) => number> = {
    default: (a, b) =>
      f.company
        ? (b.frequency[f.company] ?? 0) - (a.frequency[f.company] ?? 0) || byTitle(a, b)
        : Number(b.source === "algogym") - Number(a.source === "algogym") || b.companyCount - a.companyCount || byTitle(a, b),
    title: byTitle,
    difficulty: (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || byTitle(a, b),
    frequency: (a, b) => (f.company ? (b.frequency[f.company] ?? 0) - (a.frequency[f.company] ?? 0) : b.companyCount - a.companyCount) || byTitle(a, b),
  };
  rows.sort(sorters[f.sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  return { total: rows.length, page, pages, rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}

/** Tag slug -> count over the given problems, most common first. */
export function tagCounts(all: CatalogProblem[]) {
  const m = new Map<string, number>();
  for (const p of all) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([slug, n]) => ({ slug, n }));
}

/** 0-5 filled bars for a 0-100 frequency. */
export const frequencyBars = (frequency: number) => Math.max(frequency > 0 ? 1 : 0, Math.min(5, Math.ceil(frequency / 20)));

/** Query string for a filter change; resets the page unless the page itself changes. */
export function hrefWith(f: CatalogFilters, patch: Partial<CatalogFilters>) {
  const next = { ...f, ...("page" in patch ? {} : { page: 1 }), ...patch };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined || v === "" || (k === "sort" && v === "default") || (k === "page" && v === 1)) continue;
    p.set(k, String(v));
  }
  const qs = p.toString();
  return qs ? `/problems?${qs}` : "/problems";
}

/** Weeks (Monday first) of a month as day numbers, with null padding. month is 1-12. */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const first = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** The same problem for everyone on a given date when no daily_problems row exists (FNV-1a hash of the date). */
export function dailyPick<T>(date: string, pool: T[]): T | null {
  if (!pool.length) return null;
  let h = 0x811c9dc5;
  for (const c of date) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return pool[h % pool.length];
}

/** How often a problem is asked: at the chosen company, else its highest all-time frequency anywhere (0-100). */
export function askedFrequency(p: CatalogProblem, company?: string) {
  if (company) return p.frequency[company] ?? 0;
  return Object.values(p.frequency).reduce((m, f) => Math.max(m, f), 0);
}

/** Company slugs for a row: by the given rank (e.g. the best-known companies first), else most frequent first. */
export const topCompanies = (p: CatalogProblem, rank?: Map<string, number>) =>
  Object.entries(p.frequency)
    .sort((a, b) => (rank ? (rank.get(a[0]) ?? Infinity) - (rank.get(b[0]) ?? Infinity) : 0) || b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([slug]) => slug);

/** Solved / total of the problems you can solve here, overall and per difficulty. */
export function solveProgress(all: CatalogProblem[], solved: Set<string>) {
  const by = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } };
  for (const p of all) {
    if (p.source !== "algogym") continue;
    by[p.difficulty].total++;
    if (solved.has(p.id)) by[p.difficulty].solved++;
  }
  const solvedAll = by.Easy.solved + by.Medium.solved + by.Hard.solved;
  return { solved: solvedAll, total: by.Easy.total + by.Medium.total + by.Hard.total, by };
}

const rtf = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });
/** "just now", "5 minutes ago", "yesterday", "3 days ago"; older than a month falls back to the date. */
export function timeAgo(iso: string, now: Date) {
  const s = Math.round((Date.parse(iso) - now.getTime()) / 1000);
  if (s > -60) return "just now";
  for (const [unit, size] of [["minute", 60], ["hour", 3600], ["day", 86400]] as const) {
    const next = unit === "day" ? 31 * 86400 : unit === "hour" ? 86400 : 3600;
    if (-s < next) return rtf.format(Math.round(s / size), unit);
  }
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
