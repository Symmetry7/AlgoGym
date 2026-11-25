// Usage (from the repo root): node scripts/content/check-wrong-solutions-c1.mjs
// Each mutant is a common wrong solution named in an editorial; it must fail at least one hidden test.
// int-overflow mistakes cannot be expressed in JS; they were checked with C++ and Java variants.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";

const root = process.argv[2] ?? process.cwd();
const mutants = {
  "quiet-hours": (levels, limit) => { let best = 0, cur = 0; for (const v of levels) { cur = v < limit ? cur + 1 : 0; best = Math.max(best, cur); } return best; },
  "badge-collisions": (b) => { const m = new Map(); for (const x of b) m.set(x, (m.get(x) ?? 0) + 1); let c = 0; for (const v of m.values()) c += v * (v - 1); return c; },
  "pair-budget": (p, b) => { let c = 0; for (let i = 0; i < p.length; i++) for (let j = 0; j < p.length; j++) if (i !== j && p[i] + p[j] <= b) c++; return c; },
  "best-window": (r, k) => { let w = 0; for (let i = 0; i < k; i++) w += r[i]; let best = 0; best = Math.max(best, w); for (let i = k; i < r.length; i++) { w += r[i] - r[i - k]; best = Math.max(best, w); } return best; },
  "playlist-without-repeats": (s) => { const last = new Map(); let l = 0, best = 0; for (let r = 0; r < s.length; r++) { if (last.has(s[r])) l = last.get(s[r]) + 1; last.set(s[r], r); best = Math.max(best, r - l + 1); } return best; },
  "daily-pages": (p, d) => { const fits = (x) => { let used = 1, t = 0; for (const v of p) { if (t + v > x) { used++; t = 0; } t += v; } return used <= d; }; let lo = 1, hi = p.reduce((a, b) => a + b, 0); while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (fits(m)) hi = m; else lo = m + 1; } return lo; },
  "ticket-window": (t, q) => q.map((x) => { let lo = 0, hi = t.length; while (lo < hi) { const m = (lo + hi) >> 1; if (t[m] < x) lo = m + 1; else hi = m; } return lo; }),
  "price-alert": (p) => { const a = new Array(p.length).fill(-1), st = []; for (let i = 0; i < p.length; i++) { while (st.length && p[st[st.length - 1]] <= p[i]) a[st.pop()] = i; st.push(i); } return a; },
  "undo-and-redo": (acts) => { const doc = [], redo = []; for (const x of acts) { if (x === "<") { if (doc.length) redo.push(doc.pop()); } else if (x === ">") { if (redo.length) doc.push(redo.pop()); } else doc.push(x); } return doc.join(" "); },
  "anagram-groups": (w) => new Set(w.map((x) => [...x].reduce((s, c) => s + c.charCodeAt(0), 0) * 100 + x.length)).size,
};

let ok = true;
for (const [slug, fn] of Object.entries(mutants)) {
  const dir = join(root, "content/problems", slug, "tests/hidden");
  const caught = readdirSync(dir).filter((f) => f.endsWith(".in")).filter((f) => {
    const args = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (slug === "pair-budget" && args[0].length > 3000) return false; // O(n²) mutant: skip the timing test
    return !isDeepStrictEqual(fn(...args), JSON.parse(readFileSync(join(dir, f.replace(".in", ".out")), "utf8")));
  });
  console.log(`${caught.length ? "CAUGHT" : "MISSED"} ${slug}: fails hidden ${caught.join(", ") || "none"}`);
  if (!caught.length) ok = false;
}
process.exit(ok ? 0 : 1);
