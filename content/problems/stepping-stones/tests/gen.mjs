export const seed = 4110;

export default (g) => {
  const n = 100000;
  const ones = Array(n).fill(1);
  const wall = [...Array(n - 1).fill(1)]; wall[n / 2] = 0; wall.push(0);
  const random = g.arr(n, 0, 3); random[0] = 3;
  return [[ones], [wall], [random], [[n, ...Array(n - 1).fill(0)]]];
};
