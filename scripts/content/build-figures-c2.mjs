// Generates the four lesson diagrams as SVG (dark theme, DESIGN.md tokens).
// Usage (from the repo root): node scripts/content/build-figures-c2.mjs [outDir=apps/web/public/learn/dsa]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2] ?? "apps/web/public/learn/dsa";
const C = { bg: "#0B0B0D", cell: "#1A1A1D", border: "rgba(255,255,255,0.14)", text: "#F5F5F7", muted: "#A1A1AA", faint: "#84848D", accent: "#22C55E", soft: "rgba(34,197,94,0.14)", hard: "#EF4444" };
const SANS = "Hanken Grotesk, Segoe UI, Helvetica, Arial, sans-serif";
const MONO = "Geist Mono, ui-monospace, Consolas, Menlo, monospace";
const W = 800, H = 320;

const svg = (title, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
<title id="t">${title}</title>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="${C.accent}"/></marker>
<marker id="arrowMuted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="${C.muted}"/></marker></defs>
<rect width="${W}" height="${H}" rx="16" fill="${C.bg}"/>
${body}
</svg>
`;
const text = (x, y, s, { size = 15, fill = C.muted, anchor = "middle", font = SANS, weight = 400 } = {}) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="${font}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${s}</text>`;
// A row of cells starting at x0; style(i) returns { fill, stroke, color, strike }.
const row = (values, x0, y, size, style = () => ({})) => values.map((v, i) => {
  const x = x0 + i * (size + 8);
  const s = { fill: C.cell, stroke: C.border, color: C.text, ...style(i) };
  const strike = s.strike ? `<line x1="${x + 10}" y1="${y + size - 10}" x2="${x + size - 10}" y2="${y + 10}" stroke="${C.faint}" stroke-width="2"/>` : "";
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="10" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5"/>
${text(x + size / 2, y + size / 2 + 7, v, { size: 20, fill: s.color, font: MONO })}${strike}
${text(x + size / 2, y + size + 20, i, { size: 12, fill: C.faint, font: MONO })}`;
}).join("\n");
const cellX = (x0, size, i) => x0 + i * (size + 8);

// 1. Arrays & Strings: one pass with running state.
{
  const v = [3, 1, 4, 1, 5, 9, 2, 6], size = 64, x0 = (W - (v.length * (size + 8) - 8)) / 2, y = 84, at = 3;
  const body = [
    text(W / 2, 40, "One pass: carry what you need, never re-read", { size: 17, fill: C.text, weight: 600 }),
    row(v, x0, y, size, (i) => (i <= at ? { fill: C.soft, stroke: i === at ? C.accent : C.border } : {})),
    `<line x1="${cellX(x0, size, 0) + 6}" y1="${y - 14}" x2="${cellX(x0, size, at) + size - 6}" y2="${y - 14}" stroke="${C.accent}" stroke-width="2" marker-end="url(#arrow)"/>`,
    text(cellX(x0, size, at) + size / 2, y + size + 46, "▲ scan", { size: 13, fill: C.accent }),
    `<rect x="${W / 2 - 150}" y="${y + size + 66}" width="300" height="70" rx="12" fill="${C.cell}" stroke="${C.border}"/>`,
    text(W / 2 - 75, y + size + 94, "current", { size: 13 }), text(W / 2 - 75, y + size + 122, "4", { size: 22, fill: C.text, font: MONO }),
    text(W / 2 + 75, y + size + 94, "best", { size: 13 }), text(W / 2 + 75, y + size + 122, "4", { size: 22, fill: C.accent, font: MONO }),
  ].join("\n");
  mkdirSync(join(out, "arrays-and-strings"), { recursive: true });
  writeFileSync(join(out, "arrays-and-strings/one-pass.svg"), svg("A row of eight cells scanned left to right; a box under the scan holds two counters, current and best.", body));
}

// 2. Hashing: words into counted buckets.
{
  const words = ["tea", "jam", "tea", "bun", "tea", "jam"], buckets = [["tea", 3], ["jam", 2], ["bun", 1]];
  const wx0 = 70, wy = 70, ww = 96;
  const bucketX = (i) => 170 + i * 180, by = 196;
  const wordsSvg = words.map((w, i) => `<rect x="${wx0 + i * (ww + 18)}" y="${wy}" width="${ww}" height="40" rx="20" fill="${C.cell}" stroke="${C.border}"/>
${text(wx0 + i * (ww + 18) + ww / 2, wy + 26, w, { size: 16, fill: C.text, font: MONO })}`).join("\n");
  const arrows = words.map((w, i) => { const b = buckets.findIndex(([k]) => k === w); return `<line x1="${wx0 + i * (ww + 18) + ww / 2}" y1="${wy + 44}" x2="${bucketX(b) + 70}" y2="${by - 8}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#arrowMuted)"/>`; }).join("\n");
  const bucketsSvg = buckets.map(([k, n], i) => `<path d="M${bucketX(i)} ${by} h140 l-14 84 h-112 z" fill="${C.cell}" stroke="${i === 0 ? C.accent : C.border}" stroke-width="1.5"/>
${text(bucketX(i) + 70, by + 34, k, { size: 16, fill: C.text, font: MONO })}${text(bucketX(i) + 70, by + 66, `× ${n}`, { size: 22, fill: i === 0 ? C.accent : C.muted, font: MONO })}`).join("\n");
  const body = [text(W / 2, 40, "A hash map sends each key straight to its bucket", { size: 17, fill: C.text, weight: 600 }), wordsSvg, arrows, bucketsSvg].join("\n");
  mkdirSync(join(out, "hashing"), { recursive: true });
  writeFileSync(join(out, "hashing/buckets.svg"), svg("Words flowing into labelled buckets; each bucket's label is a key and the number on it is how many words landed there.", body));
}

// 3. Two pointers: closing in on a sorted array.
{
  const v = [1, 2, 4, 5, 7, 11], size = 72, x0 = (W - (v.length * (size + 8) - 8)) / 2, y = 96, lo = 2, hi = 4;
  const body = [
    text(W / 2, 40, "Two pointers: each step rules out a value for good", { size: 17, fill: C.text, weight: 600 }),
    text(W / 2, 66, "target 10", { size: 14, fill: C.muted, font: MONO }),
    row(v, x0, y, size, (i) => (i < lo || i > hi ? { color: C.faint, strike: true } : i === lo || i === hi ? { fill: C.soft, stroke: C.accent } : {})),
    `<line x1="${cellX(x0, size, lo) + size / 2}" y1="${y + size + 70}" x2="${cellX(x0, size, lo) + size / 2}" y2="${y + size + 30}" stroke="${C.accent}" stroke-width="2" marker-end="url(#arrow)"/>`,
    text(cellX(x0, size, lo) + size / 2, y + size + 90, "lo →", { size: 14, fill: C.accent, font: MONO }),
    `<line x1="${cellX(x0, size, hi) + size / 2}" y1="${y + size + 70}" x2="${cellX(x0, size, hi) + size / 2}" y2="${y + size + 30}" stroke="${C.accent}" stroke-width="2" marker-end="url(#arrow)"/>`,
    text(cellX(x0, size, hi) + size / 2, y + size + 90, "← hi", { size: 14, fill: C.accent, font: MONO }),
    text(W / 2, y + size + 118, "4 + 7 = 11 > 10, so move hi left", { size: 14, fill: C.muted }),
  ].join("\n");
  mkdirSync(join(out, "two-pointers"), { recursive: true });
  writeFileSync(join(out, "two-pointers/closing-in.svg"), svg("A sorted row of numbers with pointers moving in from both ends; crossed-out cells are values already ruled out.", body));
}

// 4. Sliding window.
{
  const v = [2, 1, 5, 1, 3, 2], size = 72, x0 = (W - (v.length * (size + 8) - 8)) / 2, y = 92, l = 1, r = 3;
  const wx = cellX(x0, size, l) - 8, ww = (r - l + 1) * (size + 8) + 8;
  const body = [
    text(W / 2, 40, "Sliding window: move the edges, don't re-add the middle", { size: 17, fill: C.text, weight: 600 }),
    `<rect x="${wx}" y="${y - 8}" width="${ww}" height="${size + 16}" rx="14" fill="${C.soft}" stroke="${C.accent}" stroke-width="2"/>`,
    row(v, x0, y, size),
    `<line x1="${wx}" y1="${y + size + 52}" x2="${wx + size * 0.8}" y2="${y + size + 52}" stroke="${C.accent}" stroke-width="2" marker-end="url(#arrow)"/>`,
    text(wx, y + size + 78, "left edge moves right", { size: 13, fill: C.accent, anchor: "start" }),
    `<line x1="${wx + ww - size * 0.8}" y1="${y + size + 52}" x2="${wx + ww + 8}" y2="${y + size + 52}" stroke="${C.accent}" stroke-width="2" marker-end="url(#arrow)"/>`,
    text(wx + ww + 8, y + size + 78, "right edge grows", { size: 13, fill: C.accent, anchor: "end" }),
    text(W / 2, y + size + 110, "window total 1 + 5 + 1 = 7", { size: 14, fill: C.muted, font: MONO }),
  ].join("\n");
  mkdirSync(join(out, "sliding-window"), { recursive: true });
  writeFileSync(join(out, "sliding-window/window.svg"), svg("An array with a highlighted window of three cells; the left edge moves right as the right edge grows.", body));
}
console.log("wrote 4 figures");
