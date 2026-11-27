// Usage (from the repo root): node scripts/content/build-c4.mjs
// Writes the 10 C4 problems (trees, graphs, heaps, greedy) to content/problems/<slug>/, the same way as build-c3.mjs:
// handwritten expected outputs come from an independent oracle, each JavaScript reference is checked against it on all
// handwritten cases plus 300 random small ones, and max-size tests come from tests/gen.mjs (`npm run content:gen`).
// Trees are given as child-index arrays (left[i], right[i], -1 = none) and graphs as edge lists, because the signature
// types have no node type. All references are iterative so 10^5-deep inputs can't overflow a stack.
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { helpers } from "../../packages/judge/src/gen.mjs";
import { compare } from "../../packages/judge/src/judge.mjs";

const root = process.cwd();
const meta = ({ slug, title, difficulty, topics, patterns, similar, fn, params, returns, comparator = "exact" }) => ({
  $schema: "../meta.schema.json", slug, title, status: "draft", difficulty, category: "dsa", topics, patterns, similar_to: similar,
  signature: { function: fn, params: params.map(([name, type]) => ({ name, type })), returns },
  comparator, limits: { time_ms_per_case: 1000, max_total_ms: 10000, memory_mb: 256 }, is_pro: false, pool: "public", authors: ["algogym"], reviewers: [],
});

// Shared generators: defined once here, used by the random checks and copied verbatim into gen.mjs files.
function randomTree(g, n) {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = g.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const left = Array(n).fill(-1), right = Array(n).fill(-1), open = [order[0]];
  for (let i = 1; i < n; i++) {
    const k = g.int(0, open.length - 1), p = open[k], node = order[i];
    if (left[p] === -1 && (right[p] !== -1 || g.int(0, 1))) left[p] = node; else right[p] = node;
    if (left[p] !== -1 && right[p] !== -1) { open[k] = open[open.length - 1]; open.pop(); }
    open.push(node);
  }
  return { left, right, root: order[0] };
}
function mirrorTree(g, half, value) {
  // A symmetric tree: root, a random subtree on the left and its mirror image on the right.
  if (half === 0) return { values: [value(g)], left: [-1], right: [-1], root: 0 };
  const t = randomTree(g, half), vals = Array.from({ length: half }, () => value(g));
  const n = 2 * half + 1, left = Array(n).fill(-1), right = Array(n).fill(-1), values = Array(n).fill(0);
  values[0] = value(g);
  for (let i = 0; i < half; i++) {
    values[1 + i] = vals[i]; values[1 + half + i] = vals[i];
    if (t.left[i] !== -1) { left[1 + i] = 1 + t.left[i]; right[1 + half + i] = 1 + half + t.left[i]; }
    if (t.right[i] !== -1) { right[1 + i] = 1 + t.right[i]; left[1 + half + i] = 1 + half + t.right[i]; }
  }
  left[0] = 1 + t.root; right[0] = 1 + half + t.root;
  return { values, left, right, root: 0 };
}
const TREE_GEN = `${randomTree.toString()}\n\n${mirrorTree.toString()}`;

const childrenOf = (left, right, i) => [left[i], right[i]].filter((c) => c !== -1);

const P = [];

// ─── Trees ──────────────────────────────────────────────────────────────────────────────────

const TREE_NOTE = "Nodes are numbered `0` to `n − 1`. `left[i]` and `right[i]` are node `i`'s children, or `-1` when there is none, and `root` is the top node.";

P.push({
  meta: meta({ slug: "family-tree-depth", title: "Family Tree Depth", difficulty: "Easy", topics: ["trees"], patterns: ["tree-traversal"], similar: ["leetcode:104"],
    fn: "treeDepth", params: [["left", "int[]"], ["right", "int[]"], ["root", "int"]], returns: "int" }),
  statement: `A family records its tree with each person listing at most two children. The elders want to know how many generations the tree spans.

The tree is a binary tree. ${TREE_NOTE}

Return the depth of the tree: the number of nodes on the longest path from \`root\` down to a node with no children.

## Constraints

- \`1 ≤ n ≤ 10^5\`, where \`n = left.length = right.length\`
- every node except \`root\` has exactly one parent, and following children from \`root\` reaches every node
`,
  hints: `1. The depth of a tree is 1 plus the larger depth of its two subtrees.
2. Recursion is natural, but the tree can be a single chain of 10^5 nodes. What happens to a deep recursion?
3. Walk level by level instead: keep the nodes of the current level, build the next level from their children, and count the levels.
`,
  editorial: `## Approach: count the levels (breadth-first)

Start with the level \`[root]\`. While the level isn't empty, count it and replace it with the children of its nodes. The number of levels is the depth. This visits each node once and never recurses, so a chain of 10^5 nodes is as easy as a balanced tree.

The recursive formula \`depth(node) = 1 + max(depth(left), depth(right))\` is equivalent, but its call stack grows with the tree's height.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(width of the widest level) |

## Common mistakes

- Deep recursion: a chain of 10^5 nodes overflows the default stack in several languages (hidden test).
- Counting edges instead of nodes, which is one less (hidden test: a single node has depth \`1\`).
`,
  solutions: {
    js: `function treeDepth(left, right, root) {
  let level = [root];
  let depth = 0;
  while (level.length) {
    depth++;
    const next = [];
    for (const node of level) {
      if (left[node] !== -1) next.push(left[node]);
      if (right[node] !== -1) next.push(right[node]);
    }
    level = next;
  }
  return depth;
}
`,
    py: `class Solution:
    def treeDepth(self, left: list[int], right: list[int], root: int) -> int:
        level = [root]
        depth = 0
        while level:
            depth += 1
            nxt = []
            for node in level:
                if left[node] != -1:
                    nxt.append(left[node])
                if right[node] != -1:
                    nxt.append(right[node])
            level = nxt
        return depth
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int treeDepth(vector<int>& left, vector<int>& right, int root) {
        vector<int> level = {root}, next;
        int depth = 0;
        while (!level.empty()) {
            depth++;
            next.clear();
            for (int node : level) {
                if (left[node] != -1) next.push_back(left[node]);
                if (right[node] != -1) next.push_back(right[node]);
            }
            level.swap(next);
        }
        return depth;
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    public int treeDepth(int[] left, int[] right, int root) {
        List<Integer> level = new ArrayList<>();
        level.add(root);
        int depth = 0;
        while (!level.isEmpty()) {
            depth++;
            List<Integer> next = new ArrayList<>();
            for (int node : level) {
                if (left[node] != -1) next.add(left[node]);
                if (right[node] != -1) next.add(right[node]);
            }
            level = next;
        }
        return depth;
    }
}
`,
  },
  oracle: (left, right, root) => { const d = (v) => (v === -1 ? 0 : 1 + Math.max(d(left[v]), d(right[v]))); return d(root); },
  public: [
    { args: [[1, 3, -1, -1, -1], [2, 4, -1, -1, -1], 0], explain: "Node 0 has children 1 and 2, and node 1 has children 3 and 4. The longest path 0 → 1 → 3 has three nodes." },
    { args: [[-1, -1, 0], [-1, -1, 1], 2] },
  ],
  hidden: [[[-1], [-1], 0], [[1, -1], [-1, -1], 0], [[-1, -1], [1, -1], 0], [[1, 2, 3, -1], [-1, -1, -1, -1], 0], [[-1, -1, -1, -1], [1, 2, 3, -1], 0], [[1, -1, 3, -1], [2, -1, -1, -1], 0], [[-1, 0, -1], [-1, 2, -1], 1], [[3, -1, -1, 1], [2, -1, -1, -1], 0], [[1, 3, 5, -1, -1, -1], [2, 4, -1, -1, -1, -1], 0]],
  small: (g) => { const t = randomTree(g, g.int(1, 12)); return [t.left, t.right, t.root]; },
  gen: `export const seed = 4101;

${TREE_GEN}

export default (g) => {
  const n = 100000;
  const t = randomTree(g, n);
  const chainLeft = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
  return [
    [t.left, t.right, t.root],
    [chainLeft, Array(n).fill(-1), 0],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "mirror-rangoli", title: "Mirror Rangoli", difficulty: "Easy", topics: ["trees"], patterns: ["tree-traversal"], similar: ["leetcode:101"],
    fn: "isMirror", params: [["values", "int[]"], ["left", "int[]"], ["right", "int[]"], ["root", "int"]], returns: "bool" }),
  statement: `A rangoli design is planned as a binary tree of colour codes. It looks balanced only if the left half is an exact mirror image of the right half.

${TREE_NOTE} Node \`i\` has colour \`values[i]\`.

Return \`true\` if the tree is a mirror image of itself around its centre: the same shape and the same colours, with left and right swapped at every level.

## Constraints

- \`1 ≤ n ≤ 10^5\`, where \`n = values.length = left.length = right.length\`
- \`0 ≤ values[i] ≤ 10^9\`
- every node except \`root\` has exactly one parent, and following children from \`root\` reaches every node
`,
  hints: `1. Compare the root's left subtree with its right subtree, not each subtree with itself.
2. Two subtrees \`a\` and \`b\` are mirrors when their roots match, \`a.left\` mirrors \`b.right\`, and \`a.right\` mirrors \`b.left\`.
3. Keep a queue of pairs to compare, starting with \`(left[root], right[root])\`. A pair with exactly one missing node fails.
`,
  editorial: `## Approach: compare mirrored pairs with a queue

Put the pair \`(left[root], right[root])\` in a queue. Repeatedly take a pair \`(a, b)\`. If both are \`-1\`, continue. If only one is \`-1\`, or their values differ, the tree isn't a mirror. Otherwise push \`(left[a], right[b])\` and \`(right[a], left[b])\`: the outer pair and the inner pair. If the queue empties without a mismatch, the tree is a mirror. The queue avoids deep recursion on long, thin trees.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the queue |

## Common mistakes

- Pairing \`left[a]\` with \`left[b]\`: that checks whether the halves are identical, not mirrored (hidden test).
- Comparing only values and not shape (hidden test: equal values, one-sided children).
`,
  solutions: {
    js: `function isMirror(values, left, right, root) {
  const queue = [[left[root], right[root]]];
  for (let head = 0; head < queue.length; head++) {
    const [a, b] = queue[head];
    if (a === -1 && b === -1) continue;
    if (a === -1 || b === -1 || values[a] !== values[b]) return false;
    queue.push([left[a], right[b]], [right[a], left[b]]);
  }
  return true;
}
`,
    py: `class Solution:
    def isMirror(self, values: list[int], left: list[int], right: list[int], root: int) -> bool:
        queue = [(left[root], right[root])]
        head = 0
        while head < len(queue):
            a, b = queue[head]
            head += 1
            if a == -1 and b == -1:
                continue
            if a == -1 or b == -1 or values[a] != values[b]:
                return False
            queue.append((left[a], right[b]))
            queue.append((right[a], left[b]))
        return True
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool isMirror(vector<int>& values, vector<int>& left, vector<int>& right, int root) {
        // Two parallel queues hold the pairs (a, b) still to compare.
        vector<int> qa = {left[root]}, qb = {right[root]};
        for (size_t head = 0; head < qa.size(); head++) {
            int a = qa[head], b = qb[head];
            if (a == -1 && b == -1) continue;
            if (a == -1 || b == -1 || values[a] != values[b]) return false;
            qa.push_back(left[a]);
            qb.push_back(right[b]);
            qa.push_back(right[a]);
            qb.push_back(left[b]);
        }
        return true;
    }
};
`,
    java: `class Solution {
    public boolean isMirror(int[] values, int[] left, int[] right, int root) {
        int n = values.length;
        int[] qa = new int[n + 2], qb = new int[n + 2];
        int head = 0, tail = 0;
        qa[tail] = left[root]; qb[tail] = right[root]; tail++;
        while (head < tail) {
            int a = qa[head], b = qb[head];
            head++;
            if (a == -1 && b == -1) continue;
            if (a == -1 || b == -1 || values[a] != values[b]) return false;
            qa[tail] = left[a]; qb[tail] = right[b]; tail++;
            qa[tail] = right[a]; qb[tail] = left[b]; tail++;
        }
        return true;
    }
}
`,
  },
  oracle: (values, left, right, root) => {
    const shape = (v, flip) => (v === -1 ? null : [values[v], shape(flip ? right[v] : left[v], flip), shape(flip ? left[v] : right[v], flip)]);
    return JSON.stringify(shape(left[root], false)) === JSON.stringify(shape(right[root], true));
  },
  public: [
    { args: [[1, 2, 2, 3, 4, 4, 3], [1, 3, 5, -1, -1, -1, -1], [2, 4, 6, -1, -1, -1, -1], 0], explain: "Both halves hold 2 at the top. On the outside sit 3 and 3, on the inside 4 and 4, so the tree mirrors itself." },
    { args: [[1, 2, 2, 3, 3], [1, -1, -1, -1, -1], [2, 3, 4, -1, -1], 0] },
  ],
  hidden: [[[5], [-1], [-1], 0], [[1, 2], [1, -1], [-1, -1], 0], [[1, 2, 2], [1, -1, -1], [2, -1, -1], 0], [[1, 2, 3], [1, -1, -1], [2, -1, -1], 0], [[7, 7, 7, 7, 7], [1, 3, -1, -1, -1], [2, -1, 4, -1, -1], 0], [[7, 7, 7, 7, 7], [1, 3, -1, -1, -1], [2, -1, -1, -1, -1], 0], [[1, 2, 2, 3, 3], [1, 3, 4, -1, -1], [2, -1, -1, -1, -1], 0], [[0, 9, 9, 4, 5, 5, 4], [1, 3, 5, -1, -1, -1, -1], [2, 4, 6, -1, -1, -1, -1], 0], [[0, 9, 9, 4, 5, 4, 5], [1, 3, 5, -1, -1, -1, -1], [2, 4, 6, -1, -1, -1, -1], 0]],
  small: (g) => {
    if (g.int(0, 1)) { const m = mirrorTree(g, g.int(0, 5), (h) => h.int(0, 2)); if (g.int(0, 2) === 0) m.values[g.int(0, m.values.length - 1)] = 3; return [m.values, m.left, m.right, m.root]; }
    const n = g.int(1, 9), t = randomTree(g, n); return [g.arr(n, 0, 2), t.left, t.right, t.root];
  },
  gen: `export const seed = 4102;

${TREE_GEN}

export default (g) => {
  const a = mirrorTree(g, 49999, (h) => h.int(0, 1000000000));
  const b = mirrorTree(g, 49999, (h) => h.int(0, 3));
  b.values[b.values.length - 1] += 1; // one colour differs, deep in the right half
  const chain = mirrorTree(g, 0, () => 5);
  return [[a.values, a.left, a.right, a.root], [b.values, b.left, b.right, b.root], [chain.values, chain.left, chain.right, chain.root]];
};
`,
});

P.push({
  meta: meta({ slug: "floor-totals", title: "Floor Totals", difficulty: "Medium", topics: ["trees"], patterns: ["bfs"], similar: ["leetcode:637"],
    fn: "levelTotals", params: [["values", "int[]"], ["left", "int[]"], ["right", "int[]"], ["root", "int"]], returns: "long[]" }),
  statement: `A company's reporting chart is a binary tree: each manager has at most two direct reports. Finance wants the total salary paid at each level of the chart.

${TREE_NOTE} Node \`i\` earns \`values[i]\` rupees.

Return an array whose entry \`d\` is the total of \`values\` over all nodes at depth \`d\`, where \`root\` is at depth \`0\`.

## Constraints

- \`1 ≤ n ≤ 10^5\`, where \`n = values.length = left.length = right.length\`
- \`1 ≤ values[i] ≤ 10^9\`
- every node except \`root\` has exactly one parent, and following children from \`root\` reaches every node
`,
  hints: `1. You need the nodes grouped by depth. Which traversal visits a tree one level at a time?
2. Breadth-first search with a queue: process the queue in rounds, one round per level.
3. A level can hold up to 5 × 10^4 nodes of up to 10^9 rupees each. Pick a type that can hold the total.
`,
  editorial: `## Approach: breadth-first search, one level per round

Keep the current level's nodes. Sum their values (in a 64-bit integer), append the sum to the answer, and build the next level from their children. Stop when a level is empty. Each node is handled once.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) |

## Common mistakes

- Summing in 32-bit integers: 5 × 10^4 nodes × 10^9 overflows (hidden test).
- Depth-first recursion on a 10^5-node chain overflows the stack in several languages (hidden test).
`,
  solutions: {
    js: `function levelTotals(values, left, right, root) {
  const totals = [];
  let level = [root];
  while (level.length) {
    let sum = 0;
    const next = [];
    for (const node of level) {
      sum += values[node];
      if (left[node] !== -1) next.push(left[node]);
      if (right[node] !== -1) next.push(right[node]);
    }
    totals.push(sum);
    level = next;
  }
  return totals;
}
`,
    py: `class Solution:
    def levelTotals(self, values: list[int], left: list[int], right: list[int], root: int) -> list[int]:
        totals = []
        level = [root]
        while level:
            totals.append(sum(values[node] for node in level))
            nxt = []
            for node in level:
                if left[node] != -1:
                    nxt.append(left[node])
                if right[node] != -1:
                    nxt.append(right[node])
            level = nxt
        return totals
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<long long> levelTotals(vector<int>& values, vector<int>& left, vector<int>& right, int root) {
        vector<long long> totals;
        vector<int> level = {root}, next;
        while (!level.empty()) {
            long long sum = 0;
            next.clear();
            for (int node : level) {
                sum += values[node];
                if (left[node] != -1) next.push_back(left[node]);
                if (right[node] != -1) next.push_back(right[node]);
            }
            totals.push_back(sum);
            level.swap(next);
        }
        return totals;
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    public long[] levelTotals(int[] values, int[] left, int[] right, int root) {
        List<Long> totals = new ArrayList<>();
        int[] level = {root};
        int size = 1;
        int[] next = new int[values.length];
        while (size > 0) {
            long sum = 0;
            int nextSize = 0;
            for (int i = 0; i < size; i++) {
                int node = level[i];
                sum += values[node];
                if (left[node] != -1) next[nextSize++] = left[node];
                if (right[node] != -1) next[nextSize++] = right[node];
            }
            totals.add(sum);
            level = java.util.Arrays.copyOf(next, nextSize);
            size = nextSize;
        }
        long[] out = new long[totals.size()];
        for (int i = 0; i < out.length; i++) out[i] = totals.get(i);
        return out;
    }
}
`,
  },
  oracle: (values, left, right, root) => {
    const out = [];
    const walk = (v, d) => { if (v === -1) return; out[d] = (out[d] ?? 0) + values[v]; walk(left[v], d + 1); walk(right[v], d + 1); };
    walk(root, 0);
    return out;
  },
  public: [
    { args: [[50000, 30000, 40000, 20000, 25000], [1, 3, -1, -1, -1], [2, 4, -1, -1, -1], 0], explain: "Level 0 is the root (50,000). Level 1 has 30,000 + 40,000 = 70,000. Level 2 has 20,000 + 25,000 = 45,000." },
    { args: [[7], [-1], [-1], 0] },
  ],
  hidden: [[[1, 2], [1, -1], [-1, -1], 0], [[1, 2], [-1, -1], [1, -1], 0], [[5, 5, 5, 5, 5, 5, 5], [1, 3, 5, -1, -1, -1, -1], [2, 4, 6, -1, -1, -1, -1], 0], [[1000000000, 1000000000, 1000000000], [1, -1, -1], [2, -1, -1], 0], [[1, 2, 3, 4], [-1, 0, -1, 2], [-1, -1, -1, 1], 3], [[9, 8, 7, 6], [1, 2, 3, -1], [-1, -1, -1, -1], 0], [[3, 1, 4, 1, 5, 9, 2], [1, -1, 4, -1, -1, -1, -1], [2, 3, 5, -1, 6, -1, -1], 0], [[1, 1, 1, 1], [-1, 0, -1, -1], [-1, 2, 3, -1], 1], [[2, 4, 6], [-1, 2, -1], [1, -1, -1], 0]],
  small: (g) => { const n = g.int(1, 12), t = randomTree(g, n); return [g.arr(n, 1, 1000000000), t.left, t.right, t.root]; },
  gen: `export const seed = 4103;

${TREE_GEN}

export default (g) => {
  const n = 100000;
  const t = randomTree(g, n);
  const full = { left: Array(n).fill(-1), right: Array(n).fill(-1) };
  for (let i = 0; 2 * i + 1 < n; i++) { full.left[i] = 2 * i + 1; if (2 * i + 2 < n) full.right[i] = 2 * i + 2; }
  const chainRight = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
  return [
    [g.arr(n, 1, 1000000000), t.left, t.right, t.root],
    [Array(n).fill(1000000000), full.left, full.right, 0],
    [g.arr(n, 1, 1000000000), Array(n).fill(-1), chainRight, 0],
  ];
};
`,
});

// ─── Graphs ─────────────────────────────────────────────────────────────────────────────────

P.push({
  meta: meta({ slug: "metro-hops", title: "Metro Hops", difficulty: "Medium", topics: ["graphs"], patterns: ["bfs"], similar: [],
    fn: "fewestHops", params: [["n", "int"], ["edges", "int[][]"], ["source", "int"], ["target", "int"]], returns: "int" }),
  statement: `A metro map has \`n\` stations numbered \`0\` to \`n − 1\`. Each entry \`[a, b]\` in \`edges\` is a line segment you can ride in either direction between stations \`a\` and \`b\`.

Return the fewest segments you need to ride to get from \`source\` to \`target\`, or \`-1\` if \`target\` can't be reached.

## Constraints

- \`1 ≤ n ≤ 10^5\`
- \`0 ≤ edges.length ≤ 10^5\`, each \`edges[i] = [a, b]\` with \`0 ≤ a, b < n\` and \`a ≠ b\`; a pair may appear more than once
- \`0 ≤ source, target < n\`
`,
  hints: `1. Every segment costs the same, one hop. Which search finds the fewest hops in an unweighted graph?
2. Build an adjacency list first, so each station's neighbours are one lookup away.
3. Breadth-first search from \`source\` reaches stations in order of distance. Mark a station when you queue it, not when you take it out.
`,
  editorial: `## Approach: breadth-first search on an adjacency list

Build, for each station, the list of stations one segment away. Then run BFS from \`source\` with a \`dist\` array set to \`-1\`: set \`dist[source] = 0\`, and for each station taken from the queue, give every neighbour with \`dist = -1\` the distance \`dist[current] + 1\` and queue it. BFS finishes a whole distance before starting the next, so the first time a station is reached is with its fewest hops. Return \`dist[target]\`.

## Complexity

| | |
| --- | --- |
| Time | O(n + edges) |
| Space | O(n + edges) |

## Common mistakes

- Depth-first search: it finds a path, not the shortest one (hidden test where the first branch is a detour).
- Marking stations only when they leave the queue, so a station is queued many times on dense maps.
- Forgetting that \`source = target\` needs \`0\` hops (hidden test).
`,
  solutions: {
    js: `function fewestHops(n, edges, source, target) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  const dist = new Array(n).fill(-1);
  dist[source] = 0;
  const queue = [source];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    if (u === target) return dist[u];
    for (const v of adj[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return -1;
}
`,
    py: `from collections import deque


class Solution:
    def fewestHops(self, n: int, edges: list[list[int]], source: int, target: int) -> int:
        adj = [[] for _ in range(n)]
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)
        dist = [-1] * n
        dist[source] = 0
        queue = deque([source])
        while queue:
            u = queue.popleft()
            if u == target:
                return dist[u]
            for v in adj[u]:
                if dist[v] == -1:
                    dist[v] = dist[u] + 1
                    queue.append(v)
        return -1
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int fewestHops(int n, vector<vector<int>>& edges, int source, int target) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        vector<int> dist(n, -1), queue = {source};
        dist[source] = 0;
        for (size_t head = 0; head < queue.size(); head++) {
            int u = queue[head];
            if (u == target) return dist[u];
            for (int v : adj[u]) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    queue.push_back(v);
                }
            }
        }
        return -1;
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public int fewestHops(int n, int[][] edges, int source, int target) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[source] = 0;
        int[] queue = new int[n];
        int head = 0, tail = 0;
        queue[tail++] = source;
        while (head < tail) {
            int u = queue[head++];
            if (u == target) return dist[u];
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    queue[tail++] = v;
                }
            }
        }
        return -1;
    }
}
`,
  },
  oracle: (n, edges, source, target) => {
    // Bellman-Ford style relaxation: an independent method for small inputs.
    const d = Array(n).fill(Infinity); d[source] = 0;
    for (let round = 0; round < n; round++) for (const [a, b] of edges) { d[b] = Math.min(d[b], d[a] + 1); d[a] = Math.min(d[a], d[b] + 1); }
    return Number.isFinite(d[target]) ? d[target] : -1;
  },
  public: [
    { args: [6, [[0, 1], [1, 2], [2, 5], [0, 3], [3, 4], [4, 5], [1, 4]], 0, 5], explain: "0 → 1 → 2 → 5 and 0 → 1 → 4 → 5 both take three segments; no route takes fewer." },
    { args: [4, [[0, 1], [2, 3]], 0, 3] },
  ],
  hidden: [[1, [], 0, 0], [2, [], 0, 1], [2, [[0, 1]], 1, 0], [3, [[0, 1], [0, 1], [1, 2]], 0, 2], [5, [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4]], 0, 3], [5, [[0, 1], [1, 2], [2, 3], [3, 4]], 4, 0], [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 5]], 1, 4], [4, [[1, 2], [2, 3]], 0, 3], [7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 6], [2, 6]], 3, 6]],
  small: (g) => { const n = g.int(1, 9), m = n > 1 ? g.int(0, 2 * n) : 0; const edges = []; for (let i = 0; i < m; i++) { const a = g.int(0, n - 1); let b = g.int(0, n - 1); if (a === b) b = (a + 1) % n; edges.push([a, b]); } return [n, edges.filter(([a, b]) => a !== b), g.int(0, n - 1), g.int(0, n - 1)]; },
  gen: `export const seed = 4104;

export default (g) => {
  const n = 100000;
  const chain = Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
  const random = [];
  for (let i = 1; i < n; i++) random.push([i, g.int(0, i - 1)]); // a random tree keeps everything connected
  const twoParts = Array.from({ length: n - 2 }, (_, i) => (i < n / 2 - 1 ? [i, i + 1] : [i + 1, i + 2]));
  return [
    [n, chain, 0, n - 1],
    [n, random, g.int(0, n - 1), g.int(0, n - 1)],
    [n, twoParts, 0, n - 1],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "paddy-islands", title: "Paddy Islands", difficulty: "Medium", topics: ["graphs"], patterns: ["flood-fill"], similar: ["leetcode:200"],
    fn: "countIslands", params: [["grid", "string[]"]], returns: "int" }),
  statement: `A drone photographs flooded farmland as a grid. Each cell is \`#\` for a paddy field still above water or \`.\` for water.

Fields that touch up, down, left or right belong to the same island (diagonal neighbours don't count). Given the photo \`grid\` as an array of rows, return the number of islands.

## Constraints

- \`1 ≤ grid.length ≤ 300\`, \`1 ≤ grid[i].length ≤ 300\`, and all rows have the same length
- every character is \`#\` or \`.\`
`,
  hints: `1. Scan the grid. Each time you reach a field that no island has claimed yet, you've found a new island.
2. From that field, claim every field connected to it, so the scan doesn't count it again.
3. Flood the island with breadth-first search and an explicit queue: recursion can go 90,000 levels deep on one big island.
`,
  editorial: `## Approach: scan, and flood each new island

Walk every cell. When a \`#\` cell hasn't been visited, add one to the count and flood from it: BFS over the four neighbours, marking each \`#\` cell visited as it's queued. Every cell is visited once, by the scan or by a flood.

## Complexity

| | |
| --- | --- |
| Time | O(rows × columns) |
| Space | O(rows × columns) for the visited marks |

## Common mistakes

- Counting diagonal neighbours as connected (hidden test: a checkerboard has as many islands as fields).
- Recursive flood fill: one island covering the whole 300 × 300 grid is 90,000 calls deep (hidden test).
`,
  solutions: {
    js: `function countIslands(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Uint8Array(rows * cols);
  const queue = new Int32Array(rows * cols);
  let islands = 0;
  for (let start = 0; start < rows * cols; start++) {
    if (seen[start] || grid[Math.floor(start / cols)][start % cols] !== "#") continue;
    islands++;
    seen[start] = 1;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    while (head < tail) {
      const cell = queue[head++];
      const r = Math.floor(cell / cols);
      const c = cell % cols;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const next = nr * cols + nc;
        if (!seen[next] && grid[nr][nc] === "#") {
          seen[next] = 1;
          queue[tail++] = next;
        }
      }
    }
  }
  return islands;
}
`,
    py: `from collections import deque


class Solution:
    def countIslands(self, grid: list[str]) -> int:
        rows, cols = len(grid), len(grid[0])
        seen = [[False] * cols for _ in range(rows)]
        islands = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != "#" or seen[r][c]:
                    continue
                islands += 1
                seen[r][c] = True
                queue = deque([(r, c)])
                while queue:
                    cr, cc = queue.popleft()
                    for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                        if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc] and grid[nr][nc] == "#":
                            seen[nr][nc] = True
                            queue.append((nr, nc))
        return islands
`,
    cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    int countIslands(vector<string>& grid) {
        int rows = grid.size(), cols = grid[0].size(), islands = 0;
        vector<char> seen(rows * cols, 0);
        vector<int> queue(rows * cols);
        const int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
        for (int start = 0; start < rows * cols; start++) {
            if (seen[start] || grid[start / cols][start % cols] != '#') continue;
            islands++;
            seen[start] = 1;
            int head = 0, tail = 0;
            queue[tail++] = start;
            while (head < tail) {
                int cell = queue[head++], r = cell / cols, c = cell % cols;
                for (int k = 0; k < 4; k++) {
                    int nr = r + dr[k], nc = c + dc[k];
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    int next = nr * cols + nc;
                    if (!seen[next] && grid[nr][nc] == '#') {
                        seen[next] = 1;
                        queue[tail++] = next;
                    }
                }
            }
        }
        return islands;
    }
};
`,
    java: `class Solution {
    public int countIslands(String[] grid) {
        int rows = grid.length, cols = grid[0].length(), islands = 0;
        boolean[] seen = new boolean[rows * cols];
        int[] queue = new int[rows * cols];
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        for (int start = 0; start < rows * cols; start++) {
            if (seen[start] || grid[start / cols].charAt(start % cols) != '#') continue;
            islands++;
            seen[start] = true;
            int head = 0, tail = 0;
            queue[tail++] = start;
            while (head < tail) {
                int cell = queue[head++], r = cell / cols, c = cell % cols;
                for (int k = 0; k < 4; k++) {
                    int nr = r + dr[k], nc = c + dc[k];
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    int next = nr * cols + nc;
                    if (!seen[next] && grid[nr].charAt(nc) == '#') {
                        seen[next] = true;
                        queue[tail++] = next;
                    }
                }
            }
        }
        return islands;
    }
}
`,
  },
  oracle: (grid) => {
    // Union-find over cells: an independent method from the flood fill.
    const rows = grid.length, cols = grid[0].length, parent = Array.from({ length: rows * cols }, (_, i) => i);
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === "#") {
      if (r + 1 < rows && grid[r + 1][c] === "#") parent[find(r * cols + c)] = find((r + 1) * cols + c);
      if (c + 1 < cols && grid[r][c + 1] === "#") parent[find(r * cols + c)] = find(r * cols + c + 1);
    }
    let count = 0;
    for (let i = 0; i < rows * cols; i++) if (grid[Math.floor(i / cols)][i % cols] === "#" && find(i) === i) count++;
    return count;
  },
  public: [
    { args: [["##..#", "#...#", "..#..", "....#"]], explain: "The top-left fields form one island, the two fields on the right edge another, then the lone field in the middle and the one at the bottom right: four islands." },
    { args: [["...", "..."]] },
  ],
  hidden: [[["#"]], [["."]], [["#.#", ".#.", "#.#"]], [["###", "#.#", "###"]], [["#", "#", ".", "#"]], [["#.#.#"]], [["##.##", "#...#", "##.##"]], [["...#", "####", "#..."]], [[".#.", "###", ".#."]]],
  small: (g) => { const rows = g.int(1, 6), cols = g.int(1, 6); return [Array.from({ length: rows }, () => g.word("#.", cols))]; },
  gen: `export const seed = 4105;

export default (g) => {
  const n = 300;
  const random = Array.from({ length: n }, () => Array.from({ length: n }, () => (g.random() < 0.45 ? "#" : ".")).join(""));
  const full = Array.from({ length: n }, () => "#".repeat(n));
  const checker = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => ((r + c) % 2 ? "." : "#")).join(""));
  const snake = Array.from({ length: n }, (_, r) => (r % 2 === 0 ? "#".repeat(n) : r % 4 === 1 ? ".".repeat(n - 1) + "#" : "#" + ".".repeat(n - 1)));
  return [[random], [full], [checker], [snake]];
};
`,
});

P.push({
  meta: meta({ slug: "semester-plan", title: "Semester Plan", difficulty: "Medium", topics: ["graphs"], patterns: ["topological-sort"], similar: ["leetcode:207"],
    fn: "canFinish", params: [["courses", "int"], ["prerequisites", "int[][]"]], returns: "bool" }),
  statement: `A university lists \`courses\` courses, numbered \`0\` to \`courses − 1\`. Each pair \`[a, b]\` in \`prerequisites\` means course \`b\` must be completed before course \`a\`.

Return \`true\` if there is an order in which a student can complete every course, and \`false\` if the rules contradict each other.

## Constraints

- \`1 ≤ courses ≤ 10^5\`
- \`0 ≤ prerequisites.length ≤ 10^5\`, each \`[a, b]\` with \`0 ≤ a, b < courses\`
`,
  hints: `1. Draw an arrow from \`b\` to \`a\` for each rule. When is it impossible to follow every arrow?
2. A course with no remaining prerequisites can be taken now. Taking it removes its arrows.
3. Repeatedly take every course with zero remaining prerequisites (Kahn's algorithm). If some courses are never freed, there's a cycle.
`,
  editorial: `## Approach: Kahn's algorithm (topological sort)

Count each course's prerequisites (\`indegree\`) and list, for each course, the courses it unlocks. Queue every course with indegree 0. Take courses from the queue: for each course it unlocks, lower that indegree, and queue it when it reaches 0. If the number of courses taken equals \`courses\`, an order exists. Otherwise the leftover courses sit on a cycle and can never be started.

## Complexity

| | |
| --- | --- |
| Time | O(courses + prerequisites) |
| Space | O(courses + prerequisites) |

## Common mistakes

- Missing self-rules like \`[3, 3]\`: a course that needs itself can never be taken (hidden test).
- Recursive depth-first cycle detection on a 10^5-course chain overflows the stack (hidden test).
`,
  solutions: {
    js: `function canFinish(courses, prerequisites) {
  const indegree = new Array(courses).fill(0);
  const unlocks = Array.from({ length: courses }, () => []);
  for (const [a, b] of prerequisites) {
    unlocks[b].push(a);
    indegree[a]++;
  }
  const queue = [];
  for (let c = 0; c < courses; c++) if (indegree[c] === 0) queue.push(c);
  for (let head = 0; head < queue.length; head++) {
    for (const next of unlocks[queue[head]]) {
      if (--indegree[next] === 0) queue.push(next);
    }
  }
  return queue.length === courses;
}
`,
    py: `class Solution:
    def canFinish(self, courses: int, prerequisites: list[list[int]]) -> bool:
        indegree = [0] * courses
        unlocks = [[] for _ in range(courses)]
        for a, b in prerequisites:
            unlocks[b].append(a)
            indegree[a] += 1
        queue = [c for c in range(courses) if indegree[c] == 0]
        head = 0
        while head < len(queue):
            for nxt in unlocks[queue[head]]:
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)
            head += 1
        return len(queue) == courses
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool canFinish(int courses, vector<vector<int>>& prerequisites) {
        vector<int> indegree(courses, 0), queue;
        vector<vector<int>> unlocks(courses);
        for (auto& p : prerequisites) {
            unlocks[p[1]].push_back(p[0]);
            indegree[p[0]]++;
        }
        for (int c = 0; c < courses; c++) if (indegree[c] == 0) queue.push_back(c);
        for (size_t head = 0; head < queue.size(); head++) {
            for (int next : unlocks[queue[head]]) {
                if (--indegree[next] == 0) queue.push_back(next);
            }
        }
        return (int)queue.size() == courses;
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    public boolean canFinish(int courses, int[][] prerequisites) {
        int[] indegree = new int[courses];
        List<List<Integer>> unlocks = new ArrayList<>();
        for (int i = 0; i < courses; i++) unlocks.add(new ArrayList<>());
        for (int[] p : prerequisites) {
            unlocks.get(p[1]).add(p[0]);
            indegree[p[0]]++;
        }
        int[] queue = new int[courses];
        int head = 0, tail = 0;
        for (int c = 0; c < courses; c++) if (indegree[c] == 0) queue[tail++] = c;
        while (head < tail) {
            for (int next : unlocks.get(queue[head++])) {
                if (--indegree[next] == 0) queue[tail++] = next;
            }
        }
        return tail == courses;
    }
}
`,
  },
  oracle: (courses, prerequisites) => {
    // Transitive closure on small inputs: impossible exactly when some course must come before itself.
    const reach = Array.from({ length: courses }, () => Array(courses).fill(false));
    for (const [a, b] of prerequisites) reach[b][a] = true;
    for (let k = 0; k < courses; k++) for (let i = 0; i < courses; i++) if (reach[i][k]) for (let j = 0; j < courses; j++) if (reach[k][j]) reach[i][j] = true;
    return reach.every((row, i) => !row[i]);
  },
  public: [
    { args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], explain: "Take course 0, then 1 and 2, then 3. Every rule is respected." },
    { args: [3, [[0, 1], [1, 2], [2, 0]]] },
  ],
  hidden: [[1, []], [1, [[0, 0]]], [2, [[1, 0]]], [2, [[1, 0], [0, 1]]], [5, [[1, 0], [2, 1], [3, 2], [4, 3]]], [5, [[1, 0], [2, 1], [3, 2], [4, 3], [0, 4]]], [4, [[1, 0], [1, 0], [2, 1]]], [6, [[1, 0], [2, 1], [4, 3], [5, 4], [3, 5]]], [3, []]],
  small: (g) => { const n = g.int(1, 7), m = g.int(0, 2 * n); return [n, Array.from({ length: m }, () => [g.int(0, n - 1), g.int(0, n - 1)])]; },
  gen: `export const seed = 4106;

export default (g) => {
  const n = 100000;
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = g.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const dag = [];
  for (let i = 0; i < n; i++) { const a = g.int(1, n - 1), b = g.int(0, a - 1); dag.push([order[a], order[b]]); }
  const chain = Array.from({ length: n - 1 }, (_, i) => [i + 1, i]);
  return [
    [n, dag],
    [n, [...chain.slice(0, -1), [0, n - 1]]],
    [n, chain],
  ];
};
`,
});

// ─── Heaps ──────────────────────────────────────────────────────────────────────────────────

P.push({
  meta: meta({ slug: "leaderboard-top", title: "Leaderboard Top", difficulty: "Medium", topics: ["heaps"], patterns: ["heap"], similar: ["leetcode:215"],
    fn: "topScores", params: [["scores", "int[]"], ["k", "int"]], returns: "int[]" }),
  statement: `A coding contest has \`scores\` for every participant. The leaderboard shows only the best \`k\` scores.

Return the \`k\` largest values in \`scores\`, from highest to lowest. Equal scores are listed as many times as they appear.

## Constraints

- \`1 ≤ k ≤ scores.length ≤ 10^5\`
- \`−10^9 ≤ scores[i] ≤ 10^9\`
`,
  hints: `1. Sorting everything works in O(n log n). Can you keep only what you need?
2. Keep the best \`k\` seen so far. Which of them would a new score push out?
3. A min-heap of size \`k\` keeps its smallest member on top: replace it when a bigger score arrives. Sort the \`k\` survivors at the end.
`,
  editorial: `## Approach: a min-heap of the best \`k\`

Scan the scores with a min-heap that never holds more than \`k\` values. Push each score; if the heap grows past \`k\`, pop its minimum. After the scan, the heap holds the \`k\` largest scores; sort them from highest to lowest. With small \`k\` this is O(n log k), much less than sorting everything.

(Sorting all scores and taking the top \`k\` is also accepted. The heap version is what interviews look for when \`k\` is much smaller than \`n\`.)

## Complexity

| | |
| --- | --- |
| Time | O(n log k + k log k) |
| Space | O(k) |

## Common mistakes

- Dropping duplicates: equal scores each take a place (hidden test).
- Using a max-heap of everything and popping \`k\` times: correct, but O(n) extra memory.
`,
  solutions: {
    js: `function topScores(scores, k) {
  // Binary min-heap stored in an array.
  const heap = [];
  const up = (i) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < heap.length && heap[l] < heap[m]) m = l;
      if (r < heap.length && heap[r] < heap[m]) m = r;
      if (m === i) return;
      [heap[m], heap[i]] = [heap[i], heap[m]];
      i = m;
    }
  };
  for (const s of scores) {
    if (heap.length < k) {
      heap.push(s);
      up(heap.length - 1);
    } else if (s > heap[0]) {
      heap[0] = s;
      down(0);
    }
  }
  return heap.sort((a, b) => b - a);
}
`,
    py: `import heapq


class Solution:
    def topScores(self, scores: list[int], k: int) -> list[int]:
        heap = []
        for s in scores:
            if len(heap) < k:
                heapq.heappush(heap, s)
            elif s > heap[0]:
                heapq.heapreplace(heap, s)
        return sorted(heap, reverse=True)
`,
    cpp: `#include <algorithm>
#include <functional>
#include <queue>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> topScores(vector<int>& scores, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int s : scores) {
            if ((int)heap.size() < k) heap.push(s);
            else if (s > heap.top()) {
                heap.pop();
                heap.push(s);
            }
        }
        vector<int> out;
        while (!heap.empty()) {
            out.push_back(heap.top());
            heap.pop();
        }
        reverse(out.begin(), out.end());
        return out;
    }
};
`,
    java: `import java.util.PriorityQueue;

class Solution {
    public int[] topScores(int[] scores, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int s : scores) {
            if (heap.size() < k) heap.add(s);
            else if (s > heap.peek()) {
                heap.poll();
                heap.add(s);
            }
        }
        int[] out = new int[k];
        for (int i = k - 1; i >= 0; i--) out[i] = heap.poll();
        return out;
    }
}
`,
  },
  oracle: (scores, k) => [...scores].sort((a, b) => b - a).slice(0, k),
  public: [
    { args: [[72, 95, 60, 88, 95, 41], 3], explain: "The two 95s take the first two places and 88 comes third." },
    { args: [[-5, -1, -3], 1] },
  ],
  hidden: [[[7], 1], [[3, 3, 3, 3], 2], [[1, 2, 3, 4, 5], 5], [[5, 4, 3, 2, 1], 2], [[-1000000000, 1000000000], 1], [[-1000000000, 1000000000], 2], [[2, 9, 2, 9, 2], 3], [[10, 20, 30, 40, 50, 60], 4], [[0, -1, 0, -1], 3]],
  small: (g) => { const n = g.int(1, 12); return [g.arr(n, -10, 10), g.int(1, n)]; },
  gen: `export const seed = 4107;

export default (g) => {
  const n = 100000;
  const scores = g.arr(n, -1000000000, 1000000000);
  return [[scores, 1], [scores, 500], [g.arr(n, 0, 100), n], [Array.from({ length: n }, (_, i) => i), n / 2]];
};
`,
});

P.push({
  meta: meta({ slug: "cable-joining", title: "Cable Joining", difficulty: "Medium", topics: ["heaps"], patterns: ["heap", "greedy"], similar: ["leetcode:1167"],
    fn: "minJoinCost", params: [["cables", "int[]"]], returns: "long" }),
  statement: `An electrician has several cables and needs one long cable. Joining two cables of lengths \`x\` and \`y\` metres produces one cable of \`x + y\` metres and costs \`x + y\` rupees.

Given the lengths \`cables\`, return the smallest total cost to join all of them into one cable. One cable needs no joins and costs \`0\`.

## Constraints

- \`1 ≤ cables.length ≤ 10^5\`
- \`1 ≤ cables[i] ≤ 10^4\`
`,
  hints: `1. Every cable's length is paid once for each join it's part of. Which cables should be joined as rarely as possible?
2. Long cables should be joined late. So which two should the first join use?
3. Always join the two shortest cables you currently have. A min-heap gives you them quickly, and the joined cable goes back in.
`,
  editorial: `## Approach: always join the two shortest (greedy with a min-heap)

Put every length in a min-heap. While more than one cable is left, pop the two shortest \`x\` and \`y\`, add \`x + y\` to the cost, and push \`x + y\` back. This is the same rule as building a Huffman code: a length is paid once per join it takes part in, so the shortest cables should take part in the most joins and the longest in the fewest. Joining the two shortest first does exactly that, and an exchange argument shows no other order is cheaper.

## Complexity

| | |
| --- | --- |
| Time | O(n log n) |
| Space | O(n) |

## Common mistakes

- Joining in the given order, or sorting once and joining left to right: the joined cable must go back among the others (hidden test).
- 32-bit totals: the cost can reach about 1.7 × 10^10 (hidden test).
`,
  solutions: {
    js: `function minJoinCost(cables) {
  const heap = [];
  const push = (v) => {
    heap.push(v);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l] < heap[m]) m = l;
        if (r < heap.length && heap[r] < heap[m]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  for (const c of cables) push(c);
  let cost = 0;
  while (heap.length > 1) {
    const joined = pop() + pop();
    cost += joined;
    push(joined);
  }
  return cost;
}
`,
    py: `import heapq


class Solution:
    def minJoinCost(self, cables: list[int]) -> int:
        heap = list(cables)
        heapq.heapify(heap)
        cost = 0
        while len(heap) > 1:
            joined = heapq.heappop(heap) + heapq.heappop(heap)
            cost += joined
            heapq.heappush(heap, joined)
        return cost
`,
    cpp: `#include <functional>
#include <queue>
#include <vector>
using namespace std;

class Solution {
public:
    long long minJoinCost(vector<int>& cables) {
        priority_queue<long long, vector<long long>, greater<long long>> heap(cables.begin(), cables.end());
        long long cost = 0;
        while (heap.size() > 1) {
            long long x = heap.top(); heap.pop();
            long long y = heap.top(); heap.pop();
            cost += x + y;
            heap.push(x + y);
        }
        return cost;
    }
};
`,
    java: `import java.util.PriorityQueue;

class Solution {
    public long minJoinCost(int[] cables) {
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int c : cables) heap.add((long) c);
        long cost = 0;
        while (heap.size() > 1) {
            long joined = heap.poll() + heap.poll();
            cost += joined;
            heap.add(joined);
        }
        return cost;
    }
}
`,
  },
  oracle: (cables) => {
    // Sort, then merge two sorted queues (the leftovers and the joined cables): Huffman without a heap.
    const a = [...cables].sort((x, y) => x - y), b = [];
    let i = 0, j = 0, cost = 0;
    const take = () => (j >= b.length || (i < a.length && a[i] <= b[j]) ? a[i++] : b[j++]);
    while (a.length - i + b.length - j > 1) { const s = take() + take(); cost += s; b.push(s); }
    return cost;
  },
  public: [
    { args: [[4, 3, 2, 6]], explain: "Join 2 + 3 = 5 (cost 5), then 4 + 5 = 9 (cost 9), then 6 + 9 = 15 (cost 15). The total is 29." },
    { args: [[5]] },
  ],
  hidden: [[[1, 1]], [[7, 7, 7, 7]], [[1, 2, 3, 4, 5]], [[10000, 1, 1, 1]], [[1, 10000, 10000, 10000]], [[3, 3]], [[1, 1, 1, 1, 1, 1, 1, 1]], [[9, 8, 1, 2]], [[2, 2, 3, 3, 4]]],
  small: (g) => [g.arr(g.int(1, 10), 1, 30)],
  gen: `export const seed = 4108;

export default (g) => [
  [g.arr(100000, 1, 10000)],
  [Array(100000).fill(10000)],
  [Array.from({ length: 100000 }, (_, i) => (i % 10000) + 1)],
];
`,
});

// ─── Greedy ─────────────────────────────────────────────────────────────────────────────────

P.push({
  meta: meta({ slug: "hall-bookings", title: "Hall Bookings", difficulty: "Medium", topics: ["greedy"], patterns: ["intervals", "greedy"], similar: ["leetcode:435"],
    fn: "maxBookings", params: [["requests", "int[][]"]], returns: "int" }),
  statement: `A community hall gets booking requests. Request \`i\` is \`[start, end]\`: it uses the hall from minute \`start\` up to, but not including, minute \`end\`. One event can start at the exact minute another ends.

Given \`requests\`, return the largest number of requests the hall can accept without any two overlapping.

## Constraints

- \`1 ≤ requests.length ≤ 10^5\`
- \`0 ≤ start < end ≤ 10^9\`
`,
  hints: `1. Try greedy rules on small examples: earliest start? shortest first? Find a case where each one fails.
2. Whichever request you accept first, you want the hall free again as early as possible.
3. Sort by end time and accept every request that starts at or after the last accepted end.
`,
  editorial: `## Approach: earliest end first

Sort the requests by \`end\`. Walk through them, keeping \`free\`, the minute the hall becomes free (start with the smallest possible value). Accept a request when \`start ≥ free\`, then set \`free = end\`.

Why it's optimal: some best schedule can always be rearranged to begin with the request that ends earliest, since swapping it in frees the hall no later. Repeat the argument on what's left.

## Complexity

| | |
| --- | --- |
| Time | O(n log n) for the sort |
| Space | O(n) for the sorted copy |

## Common mistakes

- Sorting by start time: one long early booking blocks many short ones (hidden test).
- Treating touching bookings as overlapping: \`[1, 3]\` and \`[3, 5]\` can both be accepted (hidden test).
`,
  solutions: {
    js: `function maxBookings(requests) {
  const sorted = [...requests].sort((a, b) => a[1] - b[1]);
  let free = -Infinity;
  let count = 0;
  for (const [start, end] of sorted) {
    if (start >= free) {
      count++;
      free = end;
    }
  }
  return count;
}
`,
    py: `class Solution:
    def maxBookings(self, requests: list[list[int]]) -> int:
        free = float("-inf")
        count = 0
        for start, end in sorted(requests, key=lambda r: r[1]):
            if start >= free:
                count += 1
                free = end
        return count
`,
    cpp: `#include <algorithm>
#include <climits>
#include <vector>
using namespace std;

class Solution {
public:
    int maxBookings(vector<vector<int>>& requests) {
        vector<vector<int>> sorted = requests;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
        long long freeAt = LLONG_MIN;
        int count = 0;
        for (auto& r : sorted) {
            if (r[0] >= freeAt) {
                count++;
                freeAt = r[1];
            }
        }
        return count;
    }
};
`,
    java: `import java.util.Arrays;

class Solution {
    public int maxBookings(int[][] requests) {
        int[][] sorted = requests.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[1], b[1]));
        long free = Long.MIN_VALUE;
        int count = 0;
        for (int[] r : sorted) {
            if (r[0] >= free) {
                count++;
                free = r[1];
            }
        }
        return count;
    }
}
`,
  },
  oracle: (requests) => {
    // Try every subset on small inputs.
    let best = 0;
    for (let m = 0; m < 1 << requests.length; m++) {
      const pick = requests.filter((_, i) => m & (1 << i)).sort((a, b) => a[0] - b[0]);
      if (pick.every((r, i) => i === 0 || pick[i - 1][1] <= r[0])) best = Math.max(best, pick.length);
    }
    return best;
  },
  public: [
    { args: [[[540, 600], [570, 630], [600, 660], [630, 720]]], explain: "Accept 540–600, then 600–660 (it starts exactly when the first ends). 630–720 overlaps it, so two requests is the most." },
    { args: [[[0, 100], [10, 20], [20, 30], [30, 40]]] },
  ],
  hidden: [[[[1, 2]]], [[[1, 3], [3, 5]]], [[[1, 3], [2, 4]]], [[[1, 5], [1, 5], [1, 5]]], [[[0, 1000000000], [1, 2], [2, 3]]], [[[5, 6], [1, 2], [3, 4]]], [[[1, 10], [2, 3], [4, 5], [6, 7], [8, 9]]], [[[1, 4], [2, 3], [3, 6], [5, 7]]], [[[7, 8], [7, 8], [8, 9]]]],
  small: (g) => [Array.from({ length: g.int(1, 9) }, () => { const s = g.int(0, 15); return [s, s + g.int(1, 6)]; })],
  gen: `export const seed = 4109;

export default (g) => {
  const n = 100000;
  const random = Array.from({ length: n }, () => { const s = g.int(0, 999000000); return [s, s + g.int(1, 1000000)]; });
  const touching = Array.from({ length: n }, (_, i) => [i * 10, i * 10 + 10]);
  const nested = Array.from({ length: n }, (_, i) => [i, 1000000000 - i]);
  return [[random], [touching], [nested]];
};
`,
});

P.push({
  meta: meta({ slug: "stepping-stones", title: "Stepping Stones", difficulty: "Medium", topics: ["greedy"], patterns: ["greedy"], similar: ["leetcode:55"],
    fn: "canCross", params: [["reach", "int[]"]], returns: "bool" }),
  statement: `Stones cross a river in a straight line, numbered \`0\` to \`n − 1\`. From stone \`i\` you can jump forward to any stone from \`i + 1\` up to \`i + reach[i]\`. A stone with \`reach[i] = 0\` is a dead end.

You start on stone \`0\`. Return \`true\` if you can reach the last stone, and \`false\` otherwise.

## Constraints

- \`1 ≤ n ≤ 10^5\`, where \`n = reach.length\`
- \`0 ≤ reach[i] ≤ 10^5\`
`,
  hints: `1. You don't need to know which jumps to make, only how far you could possibly get.
2. Walk the stones in order, tracking the farthest stone reachable so far. What does it mean if you're standing beyond it?
3. If stone \`i\` is within the farthest reach, update the reach with \`i + reach[i]\`. If you ever pass the farthest reach, the rest is unreachable.
`,
  editorial: `## Approach: track the farthest reachable stone

Keep \`farthest = 0\`. For each stone \`i\` in order: if \`i > farthest\`, stone \`i\` can't be reached, and neither can anything after it, so return \`false\`. Otherwise set \`farthest = max(farthest, i + reach[i])\`. If the loop finishes, the last stone was reachable. Every stone up to \`farthest\` is reachable, because a jump can land on any stone in its range.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Always taking the longest jump: it can land on a dead end that a shorter jump avoids (hidden test).
- Trying every path with recursion or a 2-D table: O(n · reach) times out (hidden test).
`,
  solutions: {
    js: `function canCross(reach) {
  let farthest = 0;
  for (let i = 0; i < reach.length; i++) {
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + reach[i]);
  }
  return true;
}
`,
    py: `class Solution:
    def canCross(self, reach: list[int]) -> bool:
        farthest = 0
        for i, r in enumerate(reach):
            if i > farthest:
                return False
            farthest = max(farthest, i + r)
        return True
`,
    cpp: `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    bool canCross(vector<int>& reach) {
        long long farthest = 0;
        for (int i = 0; i < (int)reach.size(); i++) {
            if (i > farthest) return false;
            farthest = max(farthest, (long long)i + reach[i]);
        }
        return true;
    }
};
`,
    java: `class Solution {
    public boolean canCross(int[] reach) {
        long farthest = 0;
        for (int i = 0; i < reach.length; i++) {
            if (i > farthest) return false;
            farthest = Math.max(farthest, (long) i + reach[i]);
        }
        return true;
    }
}
`,
  },
  oracle: (reach) => {
    const ok = Array(reach.length).fill(false); ok[0] = true;
    for (let i = 0; i < reach.length; i++) if (ok[i]) for (let j = i + 1; j <= Math.min(reach.length - 1, i + reach[i]); j++) ok[j] = true;
    return ok[reach.length - 1];
  },
  public: [
    { args: [[2, 3, 1, 1, 4]], explain: "Jump from stone 0 to stone 1, then three stones ahead to the last one." },
    { args: [[3, 2, 1, 0, 4]] },
  ],
  hidden: [[[0]], [[1]], [[0, 1]], [[1, 0]], [[2, 0, 0]], [[1, 0, 1]], [[3, 0, 0, 0, 1]], [[2, 5, 0, 0, 0, 0, 1]], [[1, 1, 1, 1, 0]], [[4, 0, 0, 0, 0, 0]]],
  small: (g) => [g.arr(g.int(1, 12), 0, 3)],
  gen: `export const seed = 4110;

export default (g) => {
  const n = 100000;
  const ones = Array(n).fill(1);
  const wall = [...Array(n - 1).fill(1)]; wall[n / 2] = 0; wall.push(0);
  const random = g.arr(n, 0, 3); random[0] = 3;
  return [[ones], [wall], [random], [[n, ...Array(n - 1).fill(0)]]];
};
`,
});

// ─── Build (same as build-c3.mjs) ───────────────────────────────────────────────────────────

const g = helpers(20261128);
for (const p of P) {
  const { slug, signature, comparator } = p.meta;
  const ref = new Function(`${p.solutions.js}\nreturn ${signature.function};`)();
  const check = (args) => {
    const want = p.oracle(...structuredClone(args));
    const got = ref(...structuredClone(args));
    assert.ok(compare(comparator, got, want), `${slug}: reference disagrees with oracle on ${JSON.stringify(args).slice(0, 200)}: got ${JSON.stringify(got).slice(0, 120)}, want ${JSON.stringify(want).slice(0, 120)}`);
    return want;
  };
  for (let i = 0; i < 300; i++) check(p.small(g));
  const pub = p.public.map((t) => ({ ...t, out: check(t.args) }));
  const hid = p.hidden.map((args) => ({ args, out: check(args) }));
  assert.ok(pub.length >= 2 && pub.length <= 3 && hid.length >= 8, `${slug}: test counts`);

  const dir = join(root, "content/problems", slug);
  rmSync(dir, { recursive: true, force: true });
  for (const sub of ["solutions", "tests/public", "tests/hidden"]) mkdirSync(join(dir, sub), { recursive: true });
  writeFileSync(join(dir, "meta.json"), JSON.stringify(p.meta, null, 2) + "\n");
  writeFileSync(join(dir, "statement.md"), p.statement);
  writeFileSync(join(dir, "hints.md"), p.hints);
  writeFileSync(join(dir, "editorial.md"), p.editorial);
  writeFileSync(join(dir, "solutions/solution.js"), p.solutions.js);
  writeFileSync(join(dir, "solutions/solution.py"), p.solutions.py);
  writeFileSync(join(dir, "solutions/solution.cpp"), p.solutions.cpp);
  writeFileSync(join(dir, "solutions/Solution.java"), p.solutions.java);
  const nn = (i) => String(i + 1).padStart(2, "0");
  pub.forEach((t, i) => {
    writeFileSync(join(dir, `tests/public/${nn(i)}.in`), JSON.stringify(t.args) + "\n");
    writeFileSync(join(dir, `tests/public/${nn(i)}.out`), JSON.stringify(t.out) + "\n");
    if (t.explain) writeFileSync(join(dir, `tests/public/${nn(i)}.explain.md`), t.explain + "\n");
  });
  hid.forEach((t, i) => {
    writeFileSync(join(dir, `tests/hidden/${nn(i)}.in`), JSON.stringify(t.args) + "\n");
    writeFileSync(join(dir, `tests/hidden/${nn(i)}.out`), JSON.stringify(t.out) + "\n");
  });
  writeFileSync(join(dir, "tests/gen.mjs"), p.gen);
  console.log(`${slug}: ${pub.length} public, ${hid.length} handwritten hidden, reference matches oracle`);
}
console.log(`wrote ${P.length} problems; now run npm run content:gen and npm run content:validate`);
