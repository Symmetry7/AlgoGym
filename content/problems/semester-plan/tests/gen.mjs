export const seed = 4106;

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
