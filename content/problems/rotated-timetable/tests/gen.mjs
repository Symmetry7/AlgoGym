export const seed = 3103;

const rotatedDistinct = (g, n) => {
  const vals = [];
  let v = -1000000000;
  for (let i = 0; i < n; i++) { v += g.int(1, 19000); vals.push(v); }
  const k = g.int(0, n - 1);
  return [...vals.slice(k), ...vals.slice(0, k)];
};

export default (g) => {
  const n = 100000;
  const a = rotatedDistinct(g, n);
  const b = rotatedDistinct(g, n);
  return [
    [a, a[g.int(0, n - 1)]],
    [a, a[0] - 1],
    [b, b[n - 1]],
  ];
};
