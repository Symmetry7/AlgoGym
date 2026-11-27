export const seed = 4105;

export default (g) => {
  const n = 300;
  const random = Array.from({ length: n }, () => Array.from({ length: n }, () => (g.random() < 0.45 ? "#" : ".")).join(""));
  const full = Array.from({ length: n }, () => "#".repeat(n));
  const checker = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => ((r + c) % 2 ? "." : "#")).join(""));
  const snake = Array.from({ length: n }, (_, r) => (r % 2 === 0 ? "#".repeat(n) : r % 4 === 1 ? ".".repeat(n - 1) + "#" : "#" + ".".repeat(n - 1)));
  return [[random], [full], [checker], [snake]];
};
