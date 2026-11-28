import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { layoutDiagram } from "./arch-layout";
import { orderLessons, parseLesson, slugify, textOf } from "./lessons";

const quiz = `quiz:
  - question: 'Q1?'
    options: ["a", "b"]
    answer: 0
    why: 'Because.'
  - question: 'Q2?'
    options: ["a", "b"]
    answer: 1
    why: 'Because.'
  - question: 'Q3?'
    options: ["a", "b", "c"]
    answer: 2
    why: 'Because.'`;

const diagram = `diagrams:
  d1:
    title: 'T'
    description: 'D'
    nodes:
      - { id: a, label: A, x: 0, y: 0, kind: client }
      - { id: b, label: B, x: 1, y: 0, kind: service }
    edges:
      - { from: a, to: b, label: HTTPS }
    steps:
      - { label: One, text: 'Go.', edges: [0] }`;

const lesson = (overrides: { meta?: string; body?: string } = {}) =>
  [
    "---",
    "track: system-design",
    "order: 1",
    "topic: demo",
    "title: Demo",
    "summary: 'A demo.'",
    "status: review",
    overrides.meta ?? `${quiz}\n${diagram}`,
    "---",
    overrides.body ?? "## The idea\r\n\r\nText.\r\n\r\n<ArchDiagram id=\"d1\" />\r\n\r\n## What interviewers look for\r\n\r\n- Things.\r\n{/* a comment */}",
  ].join("\n");

describe("parseLesson", () => {
  it("parses metadata, quiz, diagrams, blocks and the table of contents (CRLF bodies too)", () => {
    const l = parseLesson(lesson(), "demo");
    expect(l.title).toBe("Demo");
    expect(l.quiz).toHaveLength(3);
    expect(l.diagrams.d1.edges[0]).toMatchObject({ from: "a", to: "b", label: "HTTPS", async: false });
    expect(l.blocks.map((b) => b.kind)).toEqual(["markdown", "diagram", "markdown"]);
    expect(l.toc).toEqual([
      { id: "the-idea", text: "The idea" },
      { id: "what-interviewers-look-for", text: "What interviewers look for" },
    ]);
    expect(l.blocks.some((b) => b.kind === "markdown" && b.text.includes("comment"))).toBe(false);
    expect(l.minutes).toBeGreaterThanOrEqual(1);
  });

  it("ignores headings and tags inside code fences", () => {
    const body = '```\n## not a heading\n<ArchDiagram id="nope" />\n```\n<ArchDiagram id="d1" />\n## What interviewers look for\n';
    const l = parseLesson(lesson({ body }), "demo");
    expect(l.toc.map((t) => t.text)).toEqual(["What interviewers look for"]);
  });

  it("rejects broken lessons with the file name and the rule", () => {
    expect(() => parseLesson(lesson(), "other")).toThrow(/other\.mdx: topic must match/);
    expect(() => parseLesson(lesson({ body: "## What interviewers look for\n" }), "demo")).toThrow(/at least one diagram/);
    const twoDiagrams = `${quiz}\n${diagram}\n  d2:\n    title: 'T2'\n    description: 'D2'\n    nodes:\n      - { id: a, label: A, x: 0, y: 0, kind: client }\n      - { id: b, label: B, x: 1, y: 0, kind: store }\n    edges:\n      - { from: a, to: b }`;
    expect(() => parseLesson(lesson({ meta: twoDiagrams }), "demo")).toThrow(/"d2" is never placed/);
    expect(() => parseLesson(lesson({ body: '<ArchDiagram id="d1" />\n## Intro\n' }), "demo")).toThrow(/What interviewers look for/);
    expect(() => parseLesson(lesson({ body: '<ArchDiagram id="zz" />' }), "demo")).toThrow(/no diagram/);
    expect(() => parseLesson(lesson({ body: '<ArchDiagram id="d1" />\n<Callout>\n## What interviewers look for' }), "demo")).toThrow(/unknown component/);
    expect(() => parseLesson(lesson({ meta: diagram }), "demo")).toThrow(/3–5 questions/);
    expect(() => parseLesson(lesson({ meta: `${quiz.replace("answer: 2", "answer: 7")}\n${diagram}` }), "demo")).toThrow(/out of range/);
    expect(() => parseLesson(lesson({ meta: `${quiz}\n${diagram.replace("to: b", "to: ghost")}` }), "demo")).toThrow(/must join two different nodes/);
    expect(() => parseLesson(lesson({ meta: `${quiz}\n${diagram.replace("x: 1, y: 0", "x: 0, y: 0")}` }), "demo")).toThrow(/share a grid cell/);
    expect(() => parseLesson(lesson({ meta: `${quiz}\n${diagram.replace("x: 1, y: 0", "x: 9, y: 0")}` }), "demo")).toThrow(/must sit at/);
    expect(() => parseLesson(lesson({ meta: `${quiz}\n${diagram.replace("edges: [0]", "edges: [3]")}` }), "demo")).toThrow(/doesn't exist/);
  });

  it("orders lessons and rejects a repeated position", () => {
    const a = parseLesson(lesson(), "demo");
    const b = { ...a, slug: "b", order: 2 };
    expect(orderLessons([b, a]).map((l) => l.slug)).toEqual(["demo", "b"]);
    expect(() => orderLessons([a, { ...a, slug: "c" }])).toThrow(/used twice/);
  });

  it("builds heading ids that match rendered headings", () => {
    expect(slugify("Step 1: clarify requirements")).toBe("step-1-clarify-requirements");
    expect(textOf(["Hash ", { props: { children: "or" } }, " range"])).toBe("Hash or range");
  });
});

// The content validator: every shipped lesson must parse, and every diagram must lay out in both orientations.
describe("content/learn/system-design", () => {
  const dir = join(__dirname, "../../../../content/learn/system-design");
  const files = readdirSync(dir).filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));

  it("has at least 8 lessons in a gapless order", () => {
    const lessons = orderLessons(files.map((f) => parseLesson(readFileSync(join(dir, f), "utf8"), f.slice(0, -4))));
    expect(lessons.length).toBeGreaterThanOrEqual(8);
    expect(lessons.map((l) => l.order)).toEqual(lessons.map((_, i) => i + 1));
  });

  it.each(files)("%s is valid and its diagrams lay out", (file) => {
    const l = parseLesson(readFileSync(join(dir, file), "utf8"), file.slice(0, -4));
    expect(l.quiz.length).toBeGreaterThanOrEqual(3);
    for (const d of Object.values(l.diagrams)) {
      for (const o of ["wide", "tall"] as const) {
        const layout = layoutDiagram(d, o);
        expect(layout.edges.every((e) => !e.d.includes("NaN"))).toBe(true);
      }
    }
  });
});
