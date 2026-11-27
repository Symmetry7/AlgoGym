export const seed = 3101;

export default (g) => {
  const n = 100000;
  const spread = g.sorted(g.arr(n, 0, 1000000000));
  const crowded = g.sorted(g.arr(n, 0, 1439));
  return [
    [spread, spread[n >> 1]],
    [crowded, 720],
    [Array(n).fill(1000000000), 1000000000],
    [spread, 1000000000],
  ];
};
