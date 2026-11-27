export const seed = 4108;

export default (g) => [
  [g.arr(100000, 1, 10000)],
  [Array(100000).fill(10000)],
  [Array.from({ length: 100000 }, (_, i) => (i % 10000) + 1)],
];
