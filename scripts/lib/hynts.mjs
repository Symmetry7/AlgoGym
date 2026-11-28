// Pure mapping for scripts/data/import-hynts.mjs: data/hynts-catalog.json (from scripts/data/fetch-hynts.py) to rows for
// companies, catalog_problems, problem_companies, interview_sheets and interview_catalog. Metadata only (DECISIONS.md 2026-11-28).

export const titleKey = (t) => t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const leetcodeSlug = (url) => url?.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i)?.[1].toLowerCase() ?? null;
export const gfgSlug = (url) => {
  const m = url?.match(/geeksforgeeks\.org\/problems\/([^/?#]+)/i);
  return m ? slugify(m[1]) || null : null;
};

// Study-plan tracks (the owner's list, plus DSA for coding sheets).
export const TRACKS = ["system-design", "sql-database", "hr-behavioural", "cs-fundamentals", "interview-prep", "frontend", "backend", "ai-llm", "dsa"];

// Our editorial call on which topic sheets and roles feed which track. Unlisted ones (mobile, languages, security, ...)
// keep their sheet and tags but join no track beyond "interview-prep" for roles.
const SHEET_TRACKS = {
  "dbms-questions": ["cs-fundamentals", "sql-database"], "os-questions": ["cs-fundamentals"], "oops-questions": ["cs-fundamentals"], "cn-questions": ["cs-fundamentals"],
  "javascript-questions": ["frontend"], "typescript-questions": ["frontend"], "reactjs-questions": ["frontend"], "nextjs-questions": ["frontend"], "angular-questions": ["frontend"],
  "nodejs-questions": ["backend"], "spring-boot-questions": ["backend"], "git-github-questions": ["backend", "frontend"],
  "docker-questions": ["backend"], "kuberneties-questions": ["backend"], "aws-questions": ["backend"], "terraform-questions": ["backend"],
  "postgresql-questions": ["sql-database", "backend"], "mongodb-questions": ["sql-database", "backend"], "redis-questions": ["sql-database", "backend"],
};
const ROLE_TRACKS = {
  "frontend-developer": ["frontend"], "backend-developer": ["backend"], "fullstack-developer": ["frontend", "backend"],
  "ai-engineer": ["ai-llm"], "ai-research-engineer": ["ai-llm"], "llm-genai-engineer": ["ai-llm"], "mlops-engineer": ["ai-llm"], "data-scientist": ["ai-llm"],
  "data-analyst": ["sql-database"], "data-engineer": ["sql-database"],
};

/** Tracks of a whole sheet. */
export function sheetTracks(section, slug) {
  switch (section) {
    case "system-design": return ["system-design"];
    case "sql": return ["sql-database"];
    case "hr": return ["hr-behavioural"];
    case "role": return ["interview-prep", ...(ROLE_TRACKS[slug] ?? [])];
    case "topic": return SHEET_TRACKS[slug] ?? [];
    default: return ["dsa"]; // company sheets, DSA sheets, patterns
  }
}

/** Tracks of one question: its sheet's, plus any its category clearly names (a "Behavioral" block in a role sheet, say). */
export function itemTracks(section, slug, category) {
  const t = new Set(sheetTracks(section, slug));
  if (section === "role" || section === "topic") {
    if (/behavio|\bhr\b|soft skill|situational/i.test(category ?? "")) t.add("hr-behavioural");
    if (/system design|scalab|scaling|sharding|microservice/i.test(category ?? "")) t.add("system-design");
    if (/\bsql\b|database|dbms|query/i.test(category ?? "")) t.add("sql-database");
  }
  return TRACKS.filter((x) => t.has(x));
}

// hynts.in company slugs that are a company we already list under another slug.
export const COMPANY_ALIAS = { walmart: "walmart-labs" };

// Our names for single-sheet sections (not the source's headings).
const SHEET_NAMES = {
  "sql/sql-sheet": "SQL queries",
  "hr/hr-questions": "HR and behavioural",
  "system-design/system-design-sheet": "System design",
  "pattern/20-essential-dsa-patterns": "20 essential DSA patterns",
  "dsa-sheet/package-wise-dsa-sheet": "Package-wise DSA sheet",
};
const titleCase = (slug) => slug.split("-").map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1)).join(" ");

/** '<section>/<sheet>/<title key>', with '#2', '#3' for a title repeated inside one sheet. */
export function sourceKeys(section, sheet, items) {
  const seen = new Map();
  return items.map((i) => {
    const base = `${section}/${sheet}/${titleKey(i.title) || "untitled"}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}#${n}`;
  });
}

const DSA = new Set(["company", "dsa-sheet", "pattern"]);

/**
 * Everything the import should write, from the fetched catalog and what the database holds now.
 * db = { problems: [{id, slug, title, source, source_ref, difficulty}], similar: [{original_id, similar_id}],
 *        items: [{id, question}], companies: [{id, slug, name}], names: Map('<section>:<slug>' -> {title, group}) }
 * Rows that need ids the database doesn't have yet (a new company or problem) are planned first; run plan() again after
 * writing them to get the final rows. A second run of the import therefore plans nothing new.
 */
export function plan(catalog, db) {
  const bySource = new Map(db.problems.map((p) => [`${p.source}:${p.source_ref}`, p]));
  const companyBySlug = new Map(db.companies.map((c) => [c.slug, c]));
  // Title lookups: LeetCode, then GFG, for "this is the problem"; originals for "practise it here".
  const external = new Map(), original = new Map();
  for (const p of [...db.problems].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const k = titleKey(p.title);
    if (p.source === "algogym") { if (!original.has(k)) original.set(k, p); }
    else if (!external.has(k) || (external.get(k).source === "gfg" && p.source === "leetcode")) external.set(k, p);
  }
  const practiceOf = new Map(); // lc/gfg id -> the original it's linked to (first by slug)
  const originalSlug = new Map(db.problems.map((p) => [p.id, p.slug]));
  for (const s of [...db.similar].sort((a, b) => (originalSlug.get(a.original_id) ?? "").localeCompare(originalSlug.get(b.original_id) ?? ""))) {
    if (!practiceOf.has(s.similar_id)) practiceOf.set(s.similar_id, s.original_id);
  }
  const itemByTitle = new Map();
  for (const i of db.items) if (!itemByTitle.has(titleKey(i.question))) itemByTitle.set(titleKey(i.question), i.id);

  // New catalog rows: LeetCode and GFG questions on company sheets that have no row yet (the ones problem_companies needs).
  const newProblems = new Map();
  const companySheets = catalog.sheets.filter((s) => s.section === "company");
  const propose = (source, ref, q) => {
    const key = `${source}:${ref}`;
    if (bySource.has(key) || newProblems.has(key) || !q.difficulty) return;
    newProblems.set(key, { slug: `${source === "leetcode" ? "lc" : "gfg"}-${ref}`, title: q.title, difficulty: q.difficulty, category: "dsa", source, source_ref: ref, source_url: null, status: "pending" });
  };
  for (const s of companySheets) for (const q of s.items) { const lc = leetcodeSlug(q.url); if (lc) propose("leetcode", lc, q); }
  for (const p of newProblems.values()) if (!external.has(titleKey(p.title))) external.set(titleKey(p.title), p);
  for (const s of companySheets) for (const q of s.items) {
    const g = !leetcodeSlug(q.url) && gfgSlug(q.url);
    if (g && !bySource.has(`gfg:${g}`) && !external.has(titleKey(q.title))) propose("gfg", g, q);
  }

  const resolve = (q) => {
    const lc = leetcodeSlug(q.url), g = gfgSlug(q.url);
    return (lc && bySource.get(`leetcode:${lc}`)) || (g && bySource.get(`gfg:${g}`)) || external.get(titleKey(q.title)) || original.get(titleKey(q.title)) || null;
  };

  const companies = companySheets.map((s) => {
    const slug = COMPANY_ALIAS[s.slug] ?? s.slug;
    return { slug, name: companyBySlug.get(slug)?.name ?? s.title ?? titleCase(slug) };
  });

  const sheets = [], rows = [], links = new Map();
  const position = {};
  for (const s of catalog.sheets) {
    const name = db.names.get(`${s.section}:${s.slug}`);
    const tracks = sheetTracks(s.section, s.slug);
    sheets.push({
      section: s.section, slug: s.slug, title: SHEET_NAMES[`${s.section}/${s.slug}`] ?? name?.title ?? s.title ?? titleCase(s.slug),
      group_name: name?.group ?? null, tracks, position: (position[s.section] = (position[s.section] ?? 0) + 1),
      item_count: s.items.length, provenance_url: s.sourceUrl, observed_at: s.observedAt,
    });
    const company = s.section === "company" ? companyBySlug.get(COMPANY_ALIAS[s.slug] ?? s.slug) : null;
    const keys = sourceKeys(s.section, s.slug, s.items);
    s.items.forEach((q, i) => {
      const p = DSA.has(s.section) ? resolve(q) : null;
      const practice = p ? (p.source === "algogym" ? p.id : practiceOf.get(p.id) ?? original.get(titleKey(q.title))?.id ?? null) : null;
      if (company && p?.id && p.source !== "algogym") links.set(`${p.id}|${company.id}`, { problem_id: p.id, company_id: company.id, timeframe: "all" });
      rows.push({
        source_key: keys[i], section: s.section, sheet_slug: s.slug, position: q.position, title: q.title,
        difficulty: q.difficulty ?? null, category: q.category ?? null, subcategory: q.subcategory ?? null, level: q.level ?? null,
        platform: q.platform ?? null, tags: q.tags ?? [], tracks: itemTracks(s.section, s.slug, q.category),
        companies: s.section === "company" ? [COMPANY_ALIAS[s.slug] ?? s.slug] : [], roles: s.section === "role" ? [s.slug] : [],
        problem_id: p?.id ?? null, practice_problem_id: practice,
        interview_item_id: DSA.has(s.section) ? null : itemByTitle.get(titleKey(q.title)) ?? null,
        provenance_url: q.url ?? null, observed_at: s.observedAt,
      });
    });
  }
  return { companies, newProblems: [...newProblems.values()], sheets, rows, links: [...links.values()] };
}
