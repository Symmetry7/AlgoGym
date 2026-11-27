export const seed = 3108;

export default (g) => {
  const n = 100000;
  return [
    [g.arr(n, 0, 1000000000)],
    [Array.from({ length: n }, (_, i) => i + 1)],
    [Array(n).fill(1000000000)],
    [Array.from({ length: n }, (_, i) => n - i)],
  ];
};
