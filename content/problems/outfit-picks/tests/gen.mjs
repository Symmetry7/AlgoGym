export const seed = 3113;

const distinct = (g, n) => {
  const seen = new Set();
  while (seen.size < n) seen.add(g.word("abcdefghijklmnopqrstuvwxyz", 1, 10));
  return [...seen];
};

export default (g) => [[distinct(g, 12)], [distinct(g, 11)], [distinct(g, 10)]];
