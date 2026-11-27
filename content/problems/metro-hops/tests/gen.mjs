export const seed = 4104;

export default (g) => {
  const n = 100000;
  const chain = Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
  const random = [];
  for (let i = 1; i < n; i++) random.push([i, g.int(0, i - 1)]); // a random tree keeps everything connected
  const twoParts = Array.from({ length: n - 2 }, (_, i) => (i < n / 2 - 1 ? [i, i + 1] : [i + 1, i + 2]));
  return [
    [n, chain, 0, n - 1],
    [n, random, g.int(0, n - 1), g.int(0, n - 1)],
    [n, twoParts, 0, n - 1],
  ];
};
