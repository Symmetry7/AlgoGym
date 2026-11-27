export const seed = 3102;

export default (g) => {
  const n = 50000;
  return [
    [g.arr(n, 1, 500), 37],
    [g.arr(n, 1, 500), 1],
    [g.arr(n, 1, 500), n],
    [Array(n).fill(500), 7],
  ];
};
