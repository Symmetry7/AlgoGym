import { parse as parseYaml } from "yaml";

/* System-design lessons: content/learn/system-design/<slug>.mdx (docs/CONTENT_GUIDE.md, DECISIONS.md 2026-11-28).
   Frontmatter holds the metadata, the quiz and the diagrams as data; the body is markdown with
   `<ArchDiagram id="..." />` on its own line wherever a diagram goes. Pure: no fs, so it is unit-tested. */

export type NodeKind = "client" | "edge" | "service" | "cache" | "store" | "queue" | "worker" | "external";
export type DiagramNode = { id: string; label: string; sub?: string; x: number; y: number; kind: NodeKind; accent?: boolean };
export type DiagramEdge = { from: string; to: string; label?: string; async?: boolean };
export type DiagramStep = { label: string; text: string; edges: number[] };
export type Diagram = { id: string; title: string; description: string; nodes: DiagramNode[]; edges: DiagramEdge[]; steps: DiagramStep[] };
export type QuizQuestion = { question: string; options: string[]; answer: number; why: string };
export type LessonBlock = { kind: "markdown"; text: string } | { kind: "diagram"; id: string };
export type Lesson = {
  slug: string;
  order: number;
  title: string;
  summary: string;
  status: "draft" | "review" | "ready";
  minutes: number;
  quiz: QuizQuestion[];
  diagrams: Record<string, Diagram>;
  blocks: LessonBlock[];
  toc: { id: string; text: string }[];
};

const KINDS: NodeKind[] = ["client", "edge", "service", "cache", "store", "queue", "worker", "external"];
// Grid limits keep every diagram legible at 375 px, where it is drawn transposed (rows become columns).
export const GRID = { cols: 5, rows: 3, label: 13, sub: 16, edgeLabel: 9 } as const;
export const REQUIRED_SECTION = "What interviewers look for";

export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

class LessonError extends Error {}
function check(ok: unknown, file: string, message: string): asserts ok {
  if (!ok) throw new LessonError(`${file}: ${message}`);
}
const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isInt = (v: unknown): v is number => Number.isInteger(v);

function parseDiagram(id: string, raw: Record<string, unknown>, file: string): Diagram {
  const where = `${file} diagram "${id}"`;
  check(isText(raw.title) && isText(raw.description), where, "needs a title and a description");
  check(Array.isArray(raw.nodes) && raw.nodes.length >= 2, where, "needs at least 2 nodes");
  const nodes = (raw.nodes as Record<string, unknown>[]).map((n): DiagramNode => {
    check(isText(n.id) && isText(n.label), where, "every node needs an id and a label");
    const nid = n.id as string;
    check(String(n.label).length <= GRID.label, where, `node "${nid}" label is over ${GRID.label} characters`);
    check(n.sub === undefined || (isText(n.sub) && n.sub.length <= GRID.sub), where, `node "${nid}" sub is over ${GRID.sub} characters`);
    check(isInt(n.x) && n.x >= 0 && n.x < GRID.cols && isInt(n.y) && n.y >= 0 && n.y < GRID.rows, where, `node "${nid}" must sit at x 0–${GRID.cols - 1}, y 0–${GRID.rows - 1}`);
    check(KINDS.includes(n.kind as NodeKind), where, `node "${nid}" kind must be one of ${KINDS.join(", ")}`);
    return { id: nid, label: n.label as string, sub: n.sub as string | undefined, x: n.x as number, y: n.y as number, kind: n.kind as NodeKind, accent: n.accent === true };
  });
  const ids = new Set(nodes.map((n) => n.id));
  check(ids.size === nodes.length, where, "node ids must be unique");
  check(new Set(nodes.map((n) => `${n.x},${n.y}`)).size === nodes.length, where, "two nodes share a grid cell");
  check(Array.isArray(raw.edges) && raw.edges.length >= 1, where, "needs at least 1 edge");
  const edges = (raw.edges as Record<string, unknown>[]).map((e): DiagramEdge => {
    check(ids.has(e.from as string) && ids.has(e.to as string) && e.from !== e.to, where, `edge ${String(e.from)} → ${String(e.to)} must join two different nodes`);
    check(e.label === undefined || (isText(e.label) && e.label.length <= GRID.edgeLabel), where, `edge labels must be text of at most ${GRID.edgeLabel} characters`);
    return { from: e.from as string, to: e.to as string, label: e.label as string | undefined, async: e.async === true };
  });
  const steps = ((raw.steps ?? []) as Record<string, unknown>[]).map((s): DiagramStep => {
    check(isText(s.label) && isText(s.text), where, "every step needs a label and text");
    check(Array.isArray(s.edges) && s.edges.length > 0 && s.edges.every((i) => isInt(i) && i >= 0 && i < edges.length), where, `step "${String(s.label)}" lists an edge that doesn't exist`);
    return { label: s.label as string, text: s.text as string, edges: s.edges as number[] };
  });
  return { id, title: raw.title as string, description: raw.description as string, nodes, edges, steps };
}

/** Parses and validates one lesson file. Throws with the file name and the broken rule. */
export function parseLesson(source: string, slug: string): Lesson {
  const file = `${slug}.mdx`;
  const text = source.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  check(match, file, "missing frontmatter");
  const meta = parseYaml(match[1]) as Record<string, unknown>;
  check(meta && typeof meta === "object", file, "frontmatter must be a map");
  check(meta.track === "system-design", file, "track must be system-design");
  check(meta.topic === slug, file, `topic must match the file name (${slug})`);
  check(isText(meta.title) && isText(meta.summary), file, "needs a title and a summary");
  check(isInt(meta.order) && meta.order > 0, file, "order must be a positive integer");
  check(["draft", "review", "ready"].includes(meta.status as string), file, "status must be draft, review or ready");

  check(Array.isArray(meta.quiz) && meta.quiz.length >= 3 && meta.quiz.length <= 5, file, "quiz needs 3–5 questions");
  const quiz = (meta.quiz as Record<string, unknown>[]).map((q, i): QuizQuestion => {
    const options = q.options as unknown[];
    check(isText(q.question) && isText(q.why), file, `quiz ${i + 1} needs a question and a why`);
    check(Array.isArray(options) && options.length >= 2 && options.length <= 5 && options.every(isText), file, `quiz ${i + 1} needs 2–5 text options`);
    check(new Set(options).size === options.length, file, `quiz ${i + 1} repeats an option`);
    check(isInt(q.answer) && q.answer >= 0 && q.answer < options.length, file, `quiz ${i + 1} answer is out of range`);
    return { question: q.question as string, options: options as string[], answer: q.answer as number, why: q.why as string };
  });

  const rawDiagrams = (meta.diagrams ?? {}) as Record<string, Record<string, unknown>>;
  const diagrams = Object.fromEntries(Object.entries(rawDiagrams).map(([id, d]) => [id, parseDiagram(id, d, file)]));

  // Body: drop MDX comments, then split out diagram tags. Headings inside code fences are not sections.
  const body = match[2].replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  const blocks: LessonBlock[] = [];
  const toc: Lesson["toc"] = [];
  let buffer: string[] = [];
  let fenced = false;
  const flush = () => {
    const chunk = buffer.join("\n").trim();
    if (chunk) blocks.push({ kind: "markdown", text: chunk });
    buffer = [];
  };
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    const tag = fenced ? null : /^<ArchDiagram id="([a-z0-9-]+)"\s*\/>\s*$/.exec(line.trim());
    if (tag) {
      check(diagrams[tag[1]], file, `<ArchDiagram id="${tag[1]}"> has no diagram in the frontmatter`);
      flush();
      blocks.push({ kind: "diagram", id: tag[1] });
      continue;
    }
    check(fenced || !/^\s*<[A-Z]/.test(line), file, `unknown component: ${line.trim()}`);
    const heading = fenced ? null : /^## (.+)$/.exec(line);
    if (heading) toc.push({ id: slugify(heading[1]), text: heading[1].trim() });
    buffer.push(line);
  }
  flush();

  const used = new Set(blocks.flatMap((b) => (b.kind === "diagram" ? [b.id] : [])));
  check(used.size > 0, file, "needs at least one diagram");
  for (const id of Object.keys(diagrams)) check(used.has(id), file, `diagram "${id}" is never placed in the body`);
  check(toc.some((t) => t.text === REQUIRED_SECTION), file, `needs a "## ${REQUIRED_SECTION}" section`);
  check(new Set(toc.map((t) => t.id)).size === toc.length, file, "two sections have the same heading");

  const words = blocks.reduce((n, b) => n + (b.kind === "markdown" ? b.text.split(/\s+/).length : 40), 0);
  return {
    slug,
    order: meta.order as number,
    title: meta.title as string,
    summary: meta.summary as string,
    status: meta.status as Lesson["status"],
    minutes: Math.max(1, Math.round(words / 200)),
    quiz,
    diagrams,
    blocks,
    toc,
  };
}

/** Orders lessons and rejects duplicate positions. */
export function orderLessons(lessons: Lesson[]): Lesson[] {
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  sorted.forEach((l, i) => check(i === 0 || sorted[i - 1].order !== l.order, `${l.slug}.mdx`, `order ${l.order} is used twice`));
  return sorted;
}

/** Plain text of a rendered heading's children, so its id matches the table of contents. */
export function textOf(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: unknown } }).props.children);
  return "";
}
