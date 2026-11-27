// Workspace helpers (M9). Pure, so they're unit-tested.

export type Lang = "javascript" | "python" | "cpp" | "java";

// Versions the code runner uses (packages/judge/src/onlinecompiler.mjs RUNNER_COMPILERS).
export const LANGS: { id: Lang; name: string; version: string; file: string; monaco: string }[] = [
  { id: "python", name: "Python", version: "3.14", file: "solution.py", monaco: "python" },
  { id: "javascript", name: "JavaScript", version: "Node 24", file: "solution.js", monaco: "javascript" },
  { id: "cpp", name: "C++", version: "17", file: "solution.cpp", monaco: "cpp" },
  { id: "java", name: "Java", version: "25", file: "Solution.java", monaco: "java" },
];

export const draftKey = (slug: string, lang: Lang) => `algogym:draft:${slug}:${lang}`;

/** Example arguments as editable text: one line per parameter, `name = <json>`. */
export const formatInput = (params: { name: string }[], args: unknown[]) => params.map((p, i) => `${p.name} = ${JSON.stringify(args[i])}`).join("\n");

/**
 * Parse custom input written as `name = <json>` lines, in signature order. Returns the argument list, or an error
 * naming the first problem, so the Input tab can say exactly what to fix before the judge ever sees it.
 */
export function parseInput(params: { name: string }[], text: string): { args: unknown[] } | { error: string } {
  const byName = new Map<string, string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (!m) return { error: `Write each argument as name = value. This line doesn't: "${line.slice(0, 40)}"` };
    byName.set(m[1], m[2]);
  }
  const args: unknown[] = [];
  for (const p of params) {
    const value = byName.get(p.name);
    if (value === undefined) return { error: `Missing a value for ${p.name}.` };
    try { args.push(JSON.parse(value)); } catch { return { error: `${p.name} isn't valid JSON. Use [1, 2, 3] for arrays and "text" for strings.` }; }
  }
  const extra = [...byName.keys()].find((k) => !params.some((p) => p.name === k));
  if (extra) return { error: `${extra} isn't a parameter of this problem.` };
  return { args };
}

/** Clamp a panel split (fractions summing to 1) so no visible panel gets narrower than `min`. */
export function clampSplit(split: number[], min = 0.18): number[] {
  // Pin undersized panels at `min` and share what's left among the others, in proportion. Repeat until stable,
  // because shrinking the others can push one of them under `min` too.
  const pinned = split.map(() => false);
  for (let round = 0; round < split.length; round++) {
    const free = 1 - min * pinned.filter(Boolean).length;
    const rest = split.reduce((a, v, i) => (pinned[i] ? a : a + v), 0);
    const out = split.map((v, i) => (pinned[i] ? min : (v / rest) * free));
    const under = out.findIndex((v, i) => !pinned[i] && v < min);
    if (under < 0) return out;
    pinned[under] = true;
  }
  return split.map(() => 1 / split.length);
}
