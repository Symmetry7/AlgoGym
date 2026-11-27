export const seed = 4102;

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

export default (g) => {
  const a = mirrorTree(g, 49999, (h) => h.int(0, 1000000000));
  const b = mirrorTree(g, 49999, (h) => h.int(0, 3));
  b.values[b.values.length - 1] += 1; // one colour differs, deep in the right half
  const chain = mirrorTree(g, 0, () => 5);
  return [[a.values, a.left, a.right, a.root], [b.values, b.left, b.right, b.root], [chain.values, chain.left, chain.right, chain.root]];
};
