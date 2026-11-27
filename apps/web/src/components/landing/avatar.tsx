// Cartoon avatar drawn from a seed (a name): same seed, same face. No network, no photos.
const SKIN = ["#f2d3b1", "#e0ac83", "#c68a5e", "#8d5a3b", "#f7c9a6"];
const HAIR = ["#1d1d1f", "#3b2a1e", "#6b4226", "#a26a3b", "#d9d9de"];
const BG = ["#1f2937", "#312e81", "#134e4a", "#4a1d3f", "#3f3f46", "#1e3a5f"];

function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function CartoonAvatar({ seed, size = 40 }: { seed: string; size?: number }) {
  const h = hash(seed);
  const pick = <T,>(xs: T[], shift: number) => xs[(h >>> shift) % xs.length];
  const skin = pick(SKIN, 0), hair = pick(HAIR, 4), bg = pick(BG, 8);
  const style = (h >>> 12) % 3; // short, long, bun
  const glasses = (h >>> 16) % 4 === 0;
  const smile = (h >>> 18) % 2 === 0;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0 rounded-full">
      <rect width="64" height="64" fill={bg} />
      {style === 1 && <path d="M14 34c0-14 8-22 18-22s18 8 18 22v18H14z" fill={hair} />}
      <path d="M18 64c2-10 8-14 14-14s12 4 14 14z" fill={hair === "#d9d9de" ? "#52525b" : "#e4e4e7"} opacity="0.9" />
      <rect x="28" y="40" width="8" height="10" rx="3" fill={skin} />
      <ellipse cx="32" cy="30" rx="12" ry="13" fill={skin} />
      {style === 0 && <path d="M19 28c0-10 6-15 13-15s13 5 13 15c-3-4-8-6-13-6s-10 2-13 6z" fill={hair} />}
      {style === 1 && <path d="M20 26c2-8 7-11 12-11s10 3 12 11c-4-3-8-4-12-4s-8 1-12 4z" fill={hair} />}
      {style === 2 && (<><circle cx="32" cy="12" r="6" fill={hair} /><path d="M20 27c1-8 6-12 12-12s11 4 12 12c-4-3-8-4-12-4s-8 1-12 4z" fill={hair} /></>)}
      <circle cx="27" cy="31" r="1.6" fill="#18181b" />
      <circle cx="37" cy="31" r="1.6" fill="#18181b" />
      {glasses && (<g fill="none" stroke="#18181b" strokeWidth="1.2"><circle cx="27" cy="31" r="4" /><circle cx="37" cy="31" r="4" /><path d="M31 31h2" /></g>)}
      <path d={smile ? "M28 37c2 2.5 6 2.5 8 0" : "M29 37.5h6"} stroke="#18181b" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
