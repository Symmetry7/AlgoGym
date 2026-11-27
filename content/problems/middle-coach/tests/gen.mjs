export const seed = 3110;

const chain = (g, n) => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = g.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const next = Array(n).fill(-1);
  for (let i = 0; i + 1 < n; i++) next[order[i]] = order[i + 1];
  return { next, head: order[0] };
};

export default (g) => {
  const odd = chain(g, 99999);
  const even = chain(g, 100000);
  return [
    [g.arr(99999, -1000000000, 1000000000), odd.next, odd.head],
    [g.arr(100000, -1000000000, 1000000000), even.next, even.head],
  ];
};
