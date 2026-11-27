// Interview Prep items (HR and SQL, migrated in M6) and the filters on /interview.

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

/** Display names for the editorial "Useful for" role slugs (data/interview-tags.json). */
export const ROLE_NAMES: Record<string, string> = {
  "backend-developer": "Backend Developer",
  "data-analyst": "Data Analyst",
  "data-engineer": "Data Engineer",
  "data-scientist": "Data Scientist",
};

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
      // An item with no roles is general (every HR question): it stays in any role's list.
      (!f.role || i.roles.length === 0 || i.roles.includes(f.role)) &&
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
