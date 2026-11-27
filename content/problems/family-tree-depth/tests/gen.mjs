export const seed = 4101;

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
  const n = 100000;
  const t = randomTree(g, n);
  const chainLeft = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
  return [
    [t.left, t.right, t.root],
    [chainLeft, Array(n).fill(-1), 0],
  ];
};
