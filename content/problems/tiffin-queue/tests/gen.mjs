export const seed = 3107;

export default (g) => {
  const n = 100000;
  const half = Array.from({ length: n }, (_, i) => (i < n / 2 ? 1 : 0));
  return [
    [g.arr(n, 0, 1), g.arr(n, 0, 1)],
    [half, [...half].reverse()],
    [Array(n).fill(0), Array(n).fill(1)],
  ];
};
