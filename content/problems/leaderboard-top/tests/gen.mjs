export const seed = 4107;

export default (g) => {
  const n = 100000;
  const scores = g.arr(n, -1000000000, 1000000000);
  return [[scores, 1], [scores, 500], [g.arr(n, 0, 100), n], [Array.from({ length: n }, (_, i) => i), n / 2]];
};
