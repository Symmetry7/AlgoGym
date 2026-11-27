// Usage (from the repo root): node scripts/content/check-wrong-solutions-c3.mjs
// Each mutant is a common wrong solution named in the problem's editorial; it must fail at least one hidden test.
import { compare } from "../../packages/judge/src/judge.mjs";
import { loadProblem } from "../lib/problems.mjs";

const lowerBoundAnyEqual = (d, a) => { let lo = 0, hi = d.length; while (lo < hi) { const m = (lo + hi) >> 1; if (d[m] === a) return m; if (d[m] < a) lo = m + 1; else hi = m; } return lo; };
const walk = (next, head) => { const out = []; for (let c = head; c !== -1; c = next[c]) out.push(c); return out; };

const mutants = {
  "first-departure": lowerBoundAnyEqual,
  "ration-counter": (bags, days) => { // search starts at 1 and lets a bag heavier than the capacity "fit"
    const need = (c) => { let used = 1, load = 0; for (const b of bags) { if (load + b > c && load > 0) { used++; load = 0; } load += b; } return used; };
    let lo = 1, hi = bags.reduce((a, b) => a + b, 0);
    while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (need(m) <= days) hi = m; else lo = m + 1; }
    return lo;
  },
  "rotated-timetable": (t, x) => { // strict < when testing the left half
    let lo = 0, hi = t.length - 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (t[m] === x) return m; if (t[lo] < t[m]) { if (t[lo] <= x && x < t[m]) hi = m - 1; else lo = m + 1; } else { if (t[m] < x && x <= t[hi]) lo = m + 1; else hi = m - 1; } }
    return -1;
  },
  "square-plot": (area) => { // 32-bit square
    let lo = 0, hi = Math.min(area, 31622777);
    while (lo < hi) { const m = Math.floor((lo + hi + 1) / 2); if (Math.imul(m, m) <= area && Math.imul(m, m) >= 0) lo = m; else hi = m - 1; }
    return lo;
  },
  "bracket-log": (s) => ["()", "[]", "{}"].every(([o, c]) => { let d = 0; for (const ch of s) { if (ch === o) d++; if (ch === c) d--; if (d < 0) return false; } return d === 0; }),
  "warmer-day": (t) => { const a = Array(t.length).fill(0), st = []; t.forEach((v, i) => { while (st.length && t[st.at(-1)] <= v) { const j = st.pop(); a[j] = i - j; } st.push(i); }); return a; },
  "tiffin-queue": (students, tiffins) => { const want = [0, 0]; for (const s of students) want[s]++; for (const t of tiffins) if (want[t] > 0) want[t]--; return want[0] + want[1]; },
  "widest-banner": (h) => { const st = []; let best = 0; h.forEach((v, i) => { while (st.length && h[st.at(-1)] >= v) { const top = st.pop(); const left = st.length ? st.at(-1) : -1; best = Math.max(best, h[top] * (i - left - 1)); } st.push(i); }); return best; },
  "relay-reversal": (values) => [...values].reverse(),
  "middle-coach": (values, next, head) => { const w = walk(next, head); return values[w[Math.floor((w.length - 1) / 2)]]; },
  "delivery-loop": (next, head) => { let s = head, f = head; while (f !== -1 && next[f] !== -1) { s = next[s]; f = next[next[f]]; if (s === f) return s; } return -1; },
  "drop-from-end": (values, next, head, k) => { const w = walk(next, head).map((i) => values[i]); w.splice(Math.max(0, w.length - k - 1), 1); return w; },
  "outfit-picks": (items) => { const out = []; for (let m = 1; m < 1 << items.length; m++) out.push(items.filter((_, i) => m & (1 << i))); return out; },
  "keypad-messages": (digits) => { const keys = { 2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqr", 8: "tuv", 9: "wxy" }; let acc = [""]; for (const d of digits) acc = acc.flatMap((p) => [...keys[d]].map((c) => p + c)); return acc; },
  "bracket-layouts": (pairs) => { const out = []; const go = (s, o, c) => { if (s.length === 2 * pairs) { out.push(s); return; } if (o < pairs) go(s + "(", o + 1, c); if (c < o) go(s + ")", o, c + 1); }; go("", 0, 0); return out; },
};

let bad = 0;
for (const [slug, wrong] of Object.entries(mutants)) {
  const p = loadProblem(slug);
  const caught = p.cases.filter((c) => c.set === "hidden").filter((c) => !compare(p.meta.comparator, wrong(...structuredClone(c.args)), c.expected)).map((c) => c.id);
  if (!caught.length) bad++;
  console.log(`${caught.length ? "ok  " : "MISS"} ${slug}: wrong solution fails hidden ${caught.join(", ") || "nothing"}`);
}
console.log(bad ? `${bad} mutants survived` : "every mutant is caught by a hidden test");
process.exit(bad ? 1 : 0);
