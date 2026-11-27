// Usage (from the repo root): node scripts/content/check-wrong-solutions-c4.mjs
// Each mutant is a common wrong solution named in the problem's editorial; it must fail at least one hidden test.
import { compare } from "../../packages/judge/src/judge.mjs";
import { loadProblem } from "../lib/problems.mjs";

const bfsDepth = (left, right, root) => { let level = [root], d = 0; while (level.length) { d++; level = level.flatMap((v) => [left[v], right[v]].filter((c) => c !== -1)); } return d; };

const mutants = {
  "family-tree-depth": (left, right, root) => bfsDepth(left, right, root) - 1, // counts edges
  "mirror-rangoli": (values, left, right, root) => { // checks identical halves instead of mirrored ones
    const q = [[left[root], right[root]]];
    for (let h = 0; h < q.length; h++) { const [a, b] = q[h]; if (a === -1 && b === -1) continue; if (a === -1 || b === -1 || values[a] !== values[b]) return false; q.push([left[a], left[b]], [right[a], right[b]]); }
    return true;
  },
  "floor-totals": (values, left, right, root) => { const out = []; let level = [root]; while (level.length) { out.push(level.reduce((s, v) => (s + values[v]) | 0, 0)); level = level.flatMap((v) => [left[v], right[v]].filter((c) => c !== -1)); } return out; },
  "metro-hops": (n, edges, source, target) => { // depth-first: the first path found, not the shortest
    const adj = Array.from({ length: n }, () => []); for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
    const dist = Array(n).fill(-1); dist[source] = 0; const stack = [source];
    while (stack.length) { const u = stack.pop(); for (const v of adj[u]) if (dist[v] === -1) { dist[v] = dist[u] + 1; stack.push(v); } }
    return dist[target];
  },
  "paddy-islands": (grid) => { // diagonal neighbours counted as connected
    const R = grid.length, C = grid[0].length, seen = new Set(); let count = 0;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (grid[r][c] !== "#" || seen.has(r * C + c)) continue;
      count++; const st = [[r, c]]; seen.add(r * C + c);
      while (st.length) { const [y, x] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const ny = y + dy, nx = x + dx; if (ny >= 0 && nx >= 0 && ny < R && nx < C && grid[ny][nx] === "#" && !seen.has(ny * C + nx)) { seen.add(ny * C + nx); st.push([ny, nx]); } } }
    }
    return count;
  },
  "semester-plan": (courses, prerequisites) => { // ignores rules where a course needs itself
    const indeg = Array(courses).fill(0), un = Array.from({ length: courses }, () => []);
    for (const [a, b] of prerequisites) if (a !== b) { un[b].push(a); indeg[a]++; }
    const q = []; for (let c = 0; c < courses; c++) if (!indeg[c]) q.push(c);
    for (let h = 0; h < q.length; h++) for (const x of un[q[h]]) if (--indeg[x] === 0) q.push(x);
    return q.length === courses;
  },
  "leaderboard-top": (scores, k) => [...new Set(scores)].sort((a, b) => b - a).slice(0, k), // drops duplicates
  "cable-joining": (cables) => { const s = [...cables].sort((a, b) => a - b); let acc = s[0], cost = 0; for (let i = 1; i < s.length; i++) { acc += s[i]; cost += acc; } return cost; }, // joins left to right
  "hall-bookings": (requests) => { const s = [...requests].sort((a, b) => a[0] - b[0]); let free = -Infinity, n = 0; for (const [a, b] of s) if (a >= free) { n++; free = b; } return n; }, // earliest start first
  "stepping-stones": (reach) => { let i = 0; while (i < reach.length - 1) { if (reach[i] === 0) return false; i += reach[i]; } return true; }, // always the longest jump
};

let bad = 0;
for (const [slug, wrong] of Object.entries(mutants)) {
  const p = loadProblem(slug);
  const caught = p.cases.filter((c) => c.set === "hidden").filter((c) => {
    try { return !compare(p.meta.comparator, wrong(...structuredClone(c.args)), c.expected); } catch { return true; }
  }).map((c) => c.id);
  if (!caught.length) bad++;
  console.log(`${caught.length ? "ok  " : "MISS"} ${slug}: wrong solution fails hidden ${caught.join(", ") || "nothing"}`);
}
console.log(bad ? `${bad} mutants survived` : "every mutant is caught by a hidden test");
process.exit(bad ? 1 : 0);
