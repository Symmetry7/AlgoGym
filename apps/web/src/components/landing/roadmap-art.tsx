// Hero visual: a tilted roadmap path drawn in SVG with CSS perspective.
// shortcut: stands in for the real-time three.js scene (DESIGN.md §3.1); swap in when that scene is built.
const NODES = [
  { x: 70, y: 330, s: "done", label: "Arrays" },
  { x: 190, y: 270, s: "done", label: "Hashing" },
  { x: 120, y: 190, s: "done", label: "Two pointers" },
  { x: 250, y: 140, s: "current", label: "Binary search" },
  { x: 380, y: 190, s: "locked", label: "Trees" },
  { x: 450, y: 100, s: "locked", label: "Graphs" },
  { x: 330, y: 40, s: "locked", label: "DP" },
] as const;

export function RoadmapArt() {
  const path = NODES.map((n, i) => `${i ? "L" : "M"}${n.x} ${n.y}`).join(" ");
  const donePath = NODES.slice(0, 4).map((n, i) => `${i ? "L" : "M"}${n.x} ${n.y}`).join(" ");
  return (
    <div aria-hidden className="pointer-events-none select-none [perspective:1200px]">
      <svg viewBox="0 0 520 380" className="w-full [transform:rotateX(38deg)_rotateZ(-8deg)] [transform-style:preserve-3d]">
        <defs>
          <pattern id="ag-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0V26" fill="none" stroke="var(--ag-border)" strokeWidth="1" />
          </pattern>
          <radialGradient id="ag-fade" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </radialGradient>
          <mask id="ag-mask"><rect width="520" height="380" fill="url(#ag-fade)" /></mask>
        </defs>
        <rect width="520" height="380" fill="url(#ag-grid)" mask="url(#ag-mask)" />
        <path d={path} fill="none" stroke="var(--ag-surface-3)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d={donePath} fill="none" stroke="var(--ag-accent)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {NODES.map((n) => (
          <g key={n.label}>
            <ellipse cx={n.x} cy={n.y + 10} rx="26" ry="9" fill="black" opacity="0.45" />
            {n.s === "current" && <circle cx={n.x} cy={n.y} r="30" fill="none" stroke="var(--ag-text)" strokeWidth="1.5" className="origin-center animate-ping [animation-duration:2.4s] [transform-box:fill-box] motion-reduce:hidden" />}
            <circle cx={n.x} cy={n.y} r="22" fill={n.s === "done" ? "var(--ag-accent)" : n.s === "current" ? "var(--ag-text)" : "var(--ag-surface-2)"} stroke={n.s === "locked" ? "var(--ag-border-strong)" : "none"} strokeWidth="1.5" />
            <text x={n.x} y={n.y + 44} textAnchor="middle" fontSize="13" fill={n.s === "locked" ? "var(--ag-text-faint)" : "var(--ag-text-muted)"} fontFamily="var(--font-ui)">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
