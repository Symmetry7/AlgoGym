// Interview Prep: HR and SQL items with Algogym answers (M6), the question sheets, and the filters on /interview.

export type InterviewKind = "hr" | "sql";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface InterviewItem {
  id: string;
  kind: InterviewKind;
  question: string;
  answer_md: string | null;
  tags: string[];
  companies: string[];
  roles: string[];
  difficulty: Difficulty | null;
  reference_url: string | null;
  position: number;
}

export interface InterviewFilters {
  kind: InterviewKind | "all";
  topic?: string;
  company?: string;
  role?: string;
  difficulty?: Difficulty;
  q?: string;
}

const KINDS = ["all", "hr", "sql"] as const;
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

/** Parse filters from URL search params, dropping anything unknown. */
export function parseFilters(params: Record<string, string | string[] | undefined>): InterviewFilters {
  const one = (k: string) => {
    const v = params[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    return s ? s.slice(0, 120) : undefined;
  };
  const kind = one("kind");
  const difficulty = one("difficulty");
  return {
    kind: (KINDS as readonly string[]).includes(kind ?? "") ? (kind as InterviewFilters["kind"]) : "all",
    topic: one("topic"),
    company: one("company"),
    role: one("role"),
    difficulty: (DIFFICULTIES as readonly string[]).includes(difficulty ?? "") ? (difficulty as Difficulty) : undefined,
    q: one("q"),
  };
}

export function filterItems(items: InterviewItem[], f: InterviewFilters): InterviewItem[] {
  const q = f.q?.toLowerCase();
  return items.filter(
    (i) =>
      (f.kind === "all" || i.kind === f.kind) &&
      (!f.topic || i.tags.includes(f.topic)) &&
      (!f.company || i.companies.includes(f.company)) &&
      (!f.role || i.roles.includes(f.role)) &&
      (!f.difficulty || i.difficulty === f.difficulty) &&
      (!q || i.question.toLowerCase().includes(q) || (i.answer_md ?? "").toLowerCase().includes(q)),
  );
}

/** Filter choices with counts, from the items in the chosen kind. Empty lists mean the filter has nothing to offer. */
export function filterOptions(items: InterviewItem[], kind: InterviewFilters["kind"]) {
  const scoped = items.filter((i) => kind === "all" || i.kind === kind);
  const count = (pick: (i: InterviewItem) => string[]) => {
    const m = new Map<string, number>();
    for (const i of scoped) for (const v of pick(i)) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, n]) => ({ value, n }));
  };
  return { topics: count((i) => i.tags), companies: count((i) => i.companies), roles: count((i) => i.roles) };
}

/** Split an answer into prose and ```sql code blocks (the only markdown the migrated answers use). */
export function answerParts(md: string): { type: "text" | "code"; value: string }[] {
  const parts: { type: "text" | "code"; value: string }[] = [];
  const re = /```[a-z]*\n([\s\S]*?)\n```/g;
  let last = 0;
  for (let m = re.exec(md); m; m = re.exec(md)) {
    if (m.index > last) parts.push({ type: "text", value: md.slice(last, m.index).trim() });
    parts.push({ type: "code", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < md.length) parts.push({ type: "text", value: md.slice(last).trim() });
  return parts.filter((p) => p.value);
}

// ── Question sheets (interview_sheets / interview_catalog, metadata only; DECISIONS.md 2026-11-28) ──────────

export const SHEET_SECTIONS = ["company", "role", "topic", "dsa-sheet", "pattern", "system-design", "sql", "hr"] as const;
export type SheetSection = (typeof SHEET_SECTIONS)[number];
export const SECTION_LABEL: Record<SheetSection, string> = {
  company: "Company DSA sheets",
  role: "By role",
  topic: "By topic",
  "dsa-sheet": "DSA sheets",
  pattern: "DSA patterns",
  "system-design": "System design",
  sql: "SQL",
  hr: "HR and behavioural",
};
export const isSheetSection = (s: string): s is SheetSection => (SHEET_SECTIONS as readonly string[]).includes(s);

export interface InterviewSheet {
  section: SheetSection;
  slug: string;
  title: string;
  group_name: string | null;
  item_count: number;
  position: number;
}

export interface SheetQuestion {
  id: string;
  position: number;
  title: string;
  difficulty: Difficulty | null;
  category: string | null;
  subcategory: string | null;
  level: "HLD" | "LLD" | null;
  /** The Algogym original to practise this question with. */
  practice: { slug: string; title: string } | null;
  /** The Algogym-written HR or SQL answer, when this question is one of them. */
  answer: { kind: InterviewKind; question: string } | null;
}

/** Sheets grouped by section in display order; each section's sheets in source order. Empty sections are dropped. */
export function groupSheets(sheets: InterviewSheet[]) {
  return SHEET_SECTIONS.map((section) => ({
    section,
    label: SECTION_LABEL[section],
    sheets: sheets.filter((s) => s.section === section).sort((a, b) => a.position - b.position),
  })).filter((g) => g.sheets.length);
}

/** Where a sheet question opens inside Algogym, or null when it's a question to prepare on your own. Never an external URL. */
export function sheetQuestionHref(q: SheetQuestion): string | null {
  if (q.practice) return `/problems/${q.practice.slug}`;
  if (q.answer) return `/interview?${new URLSearchParams({ kind: q.answer.kind, q: q.answer.question })}#answers`;
  return null;
}

export function filterSheetQuestions(qs: SheetQuestion[], f: { q?: string; difficulty?: Difficulty }) {
  const q = f.q?.trim().toLowerCase();
  return qs.filter(
    (x) =>
      (!f.difficulty || x.difficulty === f.difficulty) &&
      (!q || x.title.toLowerCase().includes(q) || (x.category ?? "").toLowerCase().includes(q) || (x.subcategory ?? "").toLowerCase().includes(q)),
  );
}

/** Consecutive questions with the same category, in order (sheets list their questions block by block). */
export function groupByCategory(qs: SheetQuestion[]) {
  const groups: { category: string | null; questions: SheetQuestion[] }[] = [];
  for (const q of qs) {
    const last = groups[groups.length - 1];
    if (last && last.category === q.category) last.questions.push(q);
    else groups.push({ category: q.category, questions: [q] });
  }
  return groups;
}
