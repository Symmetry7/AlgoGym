export const seed = 3106;

export default (g) => {
  const n = 100000;
  const falling = Array.from({ length: n }, (_, i) => 60 - Math.floor((i * 110) / n));
  return [
    [g.arr(n, -50, 60)],
    [falling],
    [Array(n).fill(25)],
    [[...falling.slice(1), 60]],
  ];
};
