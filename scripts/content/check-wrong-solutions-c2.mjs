// Usage (from the repo root): node scripts/content/check-wrong-solutions-c2.mjs
// Each mutant is a common wrong solution named in an editorial; it must fail at least one hidden test.
// O(n²) mutants skip inputs above 3,000 elements (they would only time out).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";

const root = process.argv[2] ?? process.cwd();
const mutants = {
  "shift-rotation": (r, k) => (k ? r.slice(-k).concat(r.slice(0, -k)) : r),
  "range-totals": (v, l, r) => { const p = [0]; for (const x of v) p.push(p[p.length - 1] + x); return l.map((a, j) => p[r[j]] - p[a]); },
  "run-compression": (s) => { let out = "", start = 0; for (let i = 1; i < s.length; i++) if (s[i] !== s[start]) { out += s[start] + (i - start); start = i; } return out; },
  "matching-receipts": (a, t) => { const m = new Map(); for (const x of a) m.set(x, (m.get(x) ?? 0) + 1); let c = 0; for (const x of a) c += m.get(t - x) ?? 0; return c / 2; },
  "first-one-time-visitor": (v) => { for (let i = 0; i < v.length; i++) if (!v.slice(i + 1).includes(v[i])) return i; return -1; },
  "exact-budget-streaks": (c, t) => { let k = 0, l = 0, s = 0; for (let r = 0; r < c.length; r++) { s += c[r]; while (s > t && l <= r) s -= c[l++]; if (s === t && l <= r) k++; } return k; },
  "noisy-palindrome": (s) => { const c = s.replace(/[^A-Za-z0-9]/g, ""); return c === [...c].reverse().join(""); },
  "merge-two-shelves": (a, b) => { const out = []; let i = 0, j = 0; while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]); return out; },
  "widest-tank": (h) => { let lo = 0, hi = h.length - 1, best = 0; while (lo < hi) { best = Math.max(best, (hi - lo) * Math.min(h[lo], h[hi])); if (h[lo] > h[hi]) lo++; else hi--; } return best; },
  "shortest-funding-window": (d, g) => { let l = 0, s = 0, best = 0; for (let r = 0; r < d.length; r++) { s += d[r]; if (s >= g) { const len = r - l + 1; if (!best || len < best) best = len; s -= d[l++]; } } return best; },
};
const quadratic = new Set(["first-one-time-visitor"]);

let ok = true;
for (const [slug, fn] of Object.entries(mutants)) {
  const dir = join(root, "content/problems", slug, "tests/hidden");
  const caught = readdirSync(dir).filter((f) => f.endsWith(".in")).filter((f) => {
    const args = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (quadratic.has(slug) && args[0].length > 3000) return false;
    return !isDeepStrictEqual(fn(...args), JSON.parse(readFileSync(join(dir, f.replace(".in", ".out")), "utf8")));
  });
  console.log(`${caught.length ? "CAUGHT" : "MISSED"} ${slug}: fails hidden ${caught.join(", ") || "none"}`);
  if (!caught.length) ok = false;
}
process.exit(ok ? 0 : 1);
