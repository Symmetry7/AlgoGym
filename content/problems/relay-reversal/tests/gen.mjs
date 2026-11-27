export const seed = 3109;

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
  const straight = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
  return [
    [g.arr(n, -1000000000, 1000000000), a.next, a.head],
    [Array.from({ length: n }, (_, i) => i), straight, 0],
  ];
};
