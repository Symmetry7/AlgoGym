export const seed = 3112;

const chain = (g, n) => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = g.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const next = Array(n).fill(-1);
  for (let i = 0; i + 1 < n; i++) next[order[i]] = order[i + 1];
  return { next, head: order[0] };
};

export default (g) => {
  const n = 100000;
  const a = chain(g, n);
  const b = chain(g, n);
  const values = g.arr(n, -1000000000, 1000000000);
  return [
    [values, a.next, a.head, g.int(2, n - 1)],
    [values, b.next, b.head, n],
    [values, b.next, b.head, 1],
  ];
};
