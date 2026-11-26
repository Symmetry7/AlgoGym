// Generates the four C3 lesson diagrams as SVG (dark theme, DESIGN.md tokens).
// Usage (from the repo root): node scripts/content/build-figures-c3.mjs [outDir=apps/web/public/learn/dsa]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { C, MONO, W, cellX, row, svg, text } from "./figure-kit.mjs";

const out = process.argv[2] ?? "apps/web/public/learn/dsa";
const save = (dir, file, title, body) => {
  mkdirSync(join(out, dir), { recursive: true });
  writeFileSync(join(out, dir, file), svg(title, body));
};
const arrow = (x1, y1, x2, y2, color = C.accent, marker = "arrow") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" marker-end="url(#${marker})"/>`;
const box = (x, y, w, h, { fill = C.cell, stroke = C.border } = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;

// 1. Binary search: each comparison discards half.
{
  const v = [3, 8, 12, 17, 21, 26, 30, 34], size = 64, x0 = (W - (v.length * (size + 8) - 8)) / 2, y = 90, mid = 3;
  const body = [
    text(W / 2, 40, "Binary search: one comparison rules out half", { size: 17, fill: C.text, weight: 600 }),
    text(W / 2, 66, "looking for 26", { size: 14, fill: C.muted, font: MONO }),
    row(v, x0, y, size, (i) => (i <= mid ? { color: C.faint, strike: true } : i === mid + 1 || i === v.length - 1 ? { fill: C.soft, stroke: C.accent } : {})),
    text(cellX(x0, size, mid) + size / 2, y + size + 50, "mid: 17 < 26", { size: 14, fill: C.muted, font: MONO }),
    text(cellX(x0, size, mid + 1) + size / 2, y + size + 76, "lo", { size: 14, fill: C.accent, font: MONO }),
    text(cellX(x0, size, v.length - 1) + size / 2, y + size + 76, "hi", { size: 14, fill: C.accent, font: MONO }),
    text(W / 2, y + size + 116, "8 → 4 → 2 → 1 candidates: about log₂ n steps", { size: 14, fill: C.muted }),
  ].join("\n");
  save("binary-search", "halving.svg", "A sorted row of eight numbers searched for 26; the middle value 17 is smaller, so the left half is crossed out and the search continues between lo and hi on the right.", body);
}

// 2. Stack and queue side by side.
{
  const plates = ["push 3", "push 7", "push 5"], sx = 150, base = 250, pw = 170, ph = 40;
  const stack = plates.map((p, i) => box(sx, base - (i + 1) * (ph + 8), pw, ph, i === plates.length - 1 ? { fill: C.soft, stroke: C.accent } : {}) +
    text(sx + pw / 2, base - (i + 1) * (ph + 8) + 26, p.split(" ")[1], { size: 18, fill: C.text, font: MONO })).join("\n");
  const q = [4, 9, 2, 6], qx = 440, qy = 150, cw = 64;
  const queue = q.map((v, i) => box(qx + i * (cw + 8), qy, cw, cw, i === 0 ? { fill: C.soft, stroke: C.accent } : {}) +
    text(qx + i * (cw + 8) + cw / 2, qy + cw / 2 + 7, v, { size: 18, fill: C.text, font: MONO })).join("\n");
  const body = [
    text(W / 2, 40, "Stack: last in, first out. Queue: first in, first out.", { size: 17, fill: C.text, weight: 600 }),
    text(sx + pw / 2, 76, "stack", { size: 15, fill: C.muted }),
    stack,
    arrow(sx + pw + 46, base - 3 * (ph + 8) + 20, sx + pw + 8, base - 3 * (ph + 8) + 20),
    text(sx + pw + 52, base - 3 * (ph + 8) + 25, "push / pop", { size: 13, fill: C.accent, anchor: "start" }),
    `<line x1="${sx - 12}" y1="${base + 4}" x2="${sx + pw + 12}" y2="${base + 4}" stroke="${C.faint}" stroke-width="2"/>`,
    text(qx + (q.length * (cw + 8)) / 2, 76, "queue", { size: 15, fill: C.muted }),
    queue,
    arrow(qx - 8, qy + cw / 2, qx - 48, qy + cw / 2),
    text(qx - 28, qy + cw + 30, "leave", { size: 13, fill: C.accent }),
    arrow(qx + q.length * (cw + 8) + 40, qy + cw / 2, qx + q.length * (cw + 8), qy + cw / 2, C.muted, "arrowMuted"),
    text(qx + q.length * (cw + 8) + 20, qy + cw + 30, "join", { size: 13, fill: C.muted }),
  ].join("\n");
  save("stacks-and-queues", "stack-queue.svg", "Left: a stack of three plates where items are pushed and popped at the top. Right: a queue of four numbers where items join at the back and leave from the front.", body);
}

// 3. Linked list: reversing links with prev and cur.
{
  const vals = [11, 22, 33, 44], nx = 150, w = 84, h = 52, gap = 56, y1 = 96, y2 = 206;
  const nodes = (y, hl) => vals.map((v, i) => box(nx + i * (w + gap), y, w, h, hl(i) ? { fill: C.soft, stroke: C.accent } : {}) +
    text(nx + i * (w + gap) + w / 2, y + h / 2 + 7, v, { size: 18, fill: C.text, font: MONO })).join("\n");
  const fwd = vals.slice(0, -1).map((_, i) => arrow(nx + i * (w + gap) + w + 4, y1 + h / 2, nx + (i + 1) * (w + gap) - 6, y1 + h / 2, C.muted, "arrowMuted")).join("\n");
  const back = [0, 1].map((i) => arrow(nx + (i + 1) * (w + gap) - 6, y2 + h / 2, nx + i * (w + gap) + w + 4, y2 + h / 2)).join("\n");
  const body = [
    text(W / 2, 40, "Reversing a linked list: turn one link around per step", { size: 17, fill: C.text, weight: 600 }),
    text(nx - 20, y1 + h / 2 + 5, "before", { size: 13, anchor: "end" }),
    nodes(y1, () => false), fwd,
    text(nx - 20, y2 + h / 2 + 5, "after 3 steps", { size: 13, anchor: "end" }),
    nodes(y2, (i) => i === 2), back,
    text(nx + 2 * (w + gap) + w / 2, y2 + h + 26, "prev", { size: 13, fill: C.accent, font: MONO }),
    text(nx + 3 * (w + gap) + w / 2, y2 + h + 26, "cur", { size: 13, fill: C.muted, font: MONO }),
  ].join("\n");
  save("linked-lists", "reverse-links.svg", "Four linked nodes 11, 22, 33, 44. Below, after three steps, 22 points back to 11 and 33 back to 22; prev is on 33 and cur is on 44, the last node still to turn around.", body);
}

// 4. Recursion: the include/exclude tree for two items.
{
  const lvl = [{ y: 74, xs: [W / 2] }, { y: 158, xs: [W / 2 - 180, W / 2 + 180] }, { y: 246, xs: [W / 2 - 270, W / 2 - 90, W / 2 + 90, W / 2 + 270] }];
  const labels = [["{ }"], ["{ }", "{ a }"], ["{ }", "{ b }", "{ a }", "{ a, b }"]];
  const node = (x, y, s, leaf) => `<rect x="${x - 56}" y="${y - 20}" width="112" height="40" rx="20" fill="${leaf ? C.soft : C.cell}" stroke="${leaf ? C.accent : C.border}" stroke-width="1.5"/>
${text(x, y + 6, s, { size: 15, fill: C.text, font: MONO })}`;
  const edges = [];
  lvl.slice(0, -1).forEach((l, d) => l.xs.forEach((x, i) => [0, 1].forEach((k) => {
    const cx = lvl[d + 1].xs[i * 2 + k];
    edges.push(`<line x1="${x}" y1="${l.y + 20}" x2="${cx}" y2="${lvl[d + 1].y - 20}" stroke="${C.faint}" stroke-width="1.5"/>`);
    edges.push(text((x + cx) / 2 + (k ? 34 : -34), (l.y + lvl[d + 1].y) / 2 + 4, k ? `take ${"ab"[d]}` : `skip ${"ab"[d]}`, { size: 12, fill: C.muted }));
  })));
  const body = [
    text(W / 2, 32, "Each call decides one item, then recurses on the rest", { size: 17, fill: C.text, weight: 600 }),
    ...edges,
    ...lvl.flatMap((l, d) => l.xs.map((x, i) => node(x, l.y, labels[d][i], d === lvl.length - 1))),
  ].join("\n");
  save("recursion", "include-exclude.svg", "A recursion tree for items a and b: the root splits into skip a and take a, each splits on b, and the four leaves are the picks { }, { b }, { a } and { a, b }.", body);
}
console.log("wrote 4 figures");
