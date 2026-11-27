// Generates the four C4 lesson diagrams as SVG (dark theme, DESIGN.md tokens).
// Usage (from the repo root): node scripts/content/build-figures-c4.mjs [outDir=apps/web/public/learn/dsa]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { C, MONO, W, svg, text } from "./figure-kit.mjs";

const out = process.argv[2] ?? "apps/web/public/learn/dsa";
const save = (dir, file, title, body) => {
  mkdirSync(join(out, dir), { recursive: true });
  writeFileSync(join(out, dir, file), svg(title, body));
};
const node = (x, y, label, { r = 22, hl = false, dim = false } = {}) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${hl ? C.soft : C.cell}" stroke="${hl ? C.accent : C.border}" stroke-width="1.5"/>
${text(x, y + 6, label, { size: 15, fill: dim ? C.faint : C.text, font: MONO })}`;
const line = (x1, y1, x2, y2, color = C.faint) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>`;

// 1. Trees: levels of a binary tree.
{
  const pos = { 0: [400, 80], 1: [270, 150], 2: [530, 150], 3: [200, 225], 4: [340, 225], 5: [600, 225] };
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
  const vals = { 0: 8, 1: 3, 2: 10, 3: 1, 4: 6, 5: 14 };
  const levels = [[80, "level 0"], [150, "level 1"], [225, "level 2"]];
  const body = [
    text(W / 2, 36, "A tree, one level at a time", { size: 17, fill: C.text, weight: 600 }),
    ...levels.map(([y, l]) => `<rect x="120" y="${y - 28}" width="560" height="56" rx="12" fill="none" stroke="${C.border}" stroke-dasharray="4 6"/>${text(108, y + 5, l, { size: 13, anchor: "end" })}`),
    ...edges.map(([a, b]) => line(pos[a][0], pos[a][1] + 22, pos[b][0], pos[b][1] - 22)),
    ...Object.entries(pos).map(([k, [x, y]]) => node(x, y, vals[k], { hl: k === "0" })),
    text(W / 2, 292, "Breadth-first search visits level 0, then all of level 1, then level 2", { size: 14 }),
  ].join("\n");
  save("trees", "levels.svg", "A binary tree with root 8, children 3 and 10, and grandchildren 1, 6 and 14, grouped into three dashed bands labelled level 0, level 1 and level 2.", body);
}

// 2. Graphs: BFS distance rings from a source.
{
  const pos = { S: [140, 165], A: [290, 95], B: [290, 235], C: [450, 70], D: [450, 165], E: [450, 260], T: [620, 165] };
  const dist = { S: 0, A: 1, B: 1, C: 2, D: 2, E: 2, T: 3 };
  const edges = [["S", "A"], ["S", "B"], ["A", "C"], ["A", "D"], ["B", "D"], ["B", "E"], ["D", "T"], ["E", "T"]];
  const body = [
    text(W / 2, 36, "BFS reaches every station in order of distance", { size: 17, fill: C.text, weight: 600 }),
    ...edges.map(([a, b]) => line(pos[a][0], pos[a][1], pos[b][0], pos[b][1], ["S-A", "A-D", "D-T"].includes(`${a}-${b}`) ? C.accent : C.faint)),
    ...Object.entries(pos).map(([k, [x, y]]) => node(x, y, k, { hl: ["S", "A", "D", "T"].includes(k) })),
    ...Object.entries(pos).map(([k, [x, y]]) => text(x, y + 42, `d=${dist[k]}`, { size: 12, fill: C.faint, font: MONO })),
    text(W / 2, 306, "Highlighted: a shortest route S → A → D → T, three hops", { size: 14 }),
  ].join("\n");
  save("graphs", "bfs-rings.svg", "A graph of seven stations. Each is labelled with its BFS distance from S: A and B at 1, C, D and E at 2, T at 3. The route S, A, D, T is highlighted as a shortest path.", body);
}

// 3. Heaps: a min-heap as a tree and as an array.
{
  const heap = [2, 5, 3, 9, 6, 8];
  const pos = [[400, 74], [300, 134], [500, 134], [250, 194], [350, 194], [450, 194]];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
  const cell = 52, x0 = (W - heap.length * (cell + 6)) / 2, y = 244;
  const body = [
    text(W / 2, 36, "A min-heap: every parent is at most its children", { size: 17, fill: C.text, weight: 600 }),
    ...edges.map(([a, b]) => line(pos[a][0], pos[a][1] + 20, pos[b][0], pos[b][1] - 20)),
    ...pos.map(([x, py], i) => node(x, py, heap[i], { r: 20, hl: i === 0 })),
    ...heap.map((v, i) => `<rect x="${x0 + i * (cell + 6)}" y="${y}" width="${cell}" height="40" rx="8" fill="${i === 0 ? C.soft : C.cell}" stroke="${i === 0 ? C.accent : C.border}" stroke-width="1.5"/>
${text(x0 + i * (cell + 6) + cell / 2, y + 26, v, { size: 16, fill: C.text, font: MONO })}${text(x0 + i * (cell + 6) + cell / 2, y + 58, i, { size: 11, fill: C.faint, font: MONO })}`),
    text(x0 - 14, y + 26, "array", { size: 13, anchor: "end" }),
    text(680, 150, "children of i: 2i + 1, 2i + 2", { size: 13, anchor: "end", font: MONO }),
  ].join("\n");
  save("heaps", "min-heap.svg", "A min-heap holding 2, 5, 3, 9, 6 and 8, drawn as a tree with 2 at the top and as the array [2, 5, 3, 9, 6, 8], where the children of index i sit at 2i + 1 and 2i + 2.", body);
}

// 4. Greedy: interval scheduling by earliest end.
{
  const reqs = [[0, 4, false], [1, 3, true], [3, 6, true], [4, 9, false], [6, 8, true], [8, 11, true], [5, 12, false]];
  const scale = 46, x0 = 130, y0 = 70, rowH = 30;
  const body = [
    text(W / 2, 36, "Greedy: always take the booking that ends first", { size: 17, fill: C.text, weight: 600 }),
    ...reqs.map(([s, e, take], i) => `<rect x="${x0 + s * scale}" y="${y0 + i * rowH}" width="${(e - s) * scale - 4}" height="20" rx="6" fill="${take ? C.soft : C.cell}" stroke="${take ? C.accent : C.border}" stroke-width="1.5"/>
${text(x0 + e * scale + 4, y0 + i * rowH + 15, `${s}–${e}`, { size: 12, fill: take ? C.accent : C.faint, anchor: "start", font: MONO })}`),
    text(W / 2, y0 + reqs.length * rowH + 22, "Sorted by end time: 1–3, 3–6, 6–8 and 8–11 fit; the rest overlap", { size: 14 }),
  ].join("\n");
  save("greedy", "earliest-end.svg", "Seven booking bars on a timeline. The four that end earliest without overlapping, 1–3, 3–6, 6–8 and 8–11, are highlighted; the others overlap them.", body);
}
console.log("wrote 4 figures");
