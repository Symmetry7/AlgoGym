// Shared drawing helpers for the lesson diagrams (dark theme, DESIGN.md tokens).
export const C = { bg: "#0B0B0D", cell: "#1A1A1D", border: "rgba(255,255,255,0.14)", text: "#F5F5F7", muted: "#A1A1AA", faint: "#84848D", accent: "#22C55E", soft: "rgba(34,197,94,0.14)", hard: "#EF4444" };
export const SANS = "Hanken Grotesk, Segoe UI, Helvetica, Arial, sans-serif";
export const MONO = "Geist Mono, ui-monospace, Consolas, Menlo, monospace";
export const W = 800, H = 320;

export const svg = (title, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
<title id="t">${title}</title>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="${C.accent}"/></marker>
<marker id="arrowMuted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="${C.muted}"/></marker></defs>
<rect width="${W}" height="${H}" rx="16" fill="${C.bg}"/>
${body}
</svg>
`;
export const text = (x, y, s, { size = 15, fill = C.muted, anchor = "middle", font = SANS, weight = 400 } = {}) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="${font}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`;
// A row of cells starting at x0; style(i) returns { fill, stroke, color, strike }.
export const row = (values, x0, y, size, style = () => ({})) => values.map((v, i) => {
  const x = x0 + i * (size + 8);
  const s = { fill: C.cell, stroke: C.border, color: C.text, ...style(i) };
  const strike = s.strike ? `<line x1="${x + 10}" y1="${y + size - 10}" x2="${x + size - 10}" y2="${y + 10}" stroke="${C.faint}" stroke-width="2"/>` : "";
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="10" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5"/>
${text(x + size / 2, y + size / 2 + 7, v, { size: 20, fill: s.color, font: MONO })}${strike}
${text(x + size / 2, y + size + 20, i, { size: 12, fill: C.faint, font: MONO })}`;
}).join("\n");
export const cellX = (x0, size, i) => x0 + i * (size + 8);
