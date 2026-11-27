export const seed = 4109;

export default (g) => {
  const n = 100000;
  const random = Array.from({ length: n }, () => { const s = g.int(0, 999000000); return [s, s + g.int(1, 1000000)]; });
  const touching = Array.from({ length: n }, (_, i) => [i * 10, i * 10 + 10]);
  const nested = Array.from({ length: n }, (_, i) => [i, 1000000000 - i]);
  return [[random], [touching], [nested]];
};
