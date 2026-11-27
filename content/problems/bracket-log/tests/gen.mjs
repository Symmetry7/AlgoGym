export const seed = 3105;

// A random balanced string of n pairs, built with a stack so the nesting is varied.
const balanced = (g, n) => {
  const open = "([{", close = ")]}";
  const out = [], stack = [];
  let left = n;
  while (left > 0 || stack.length) {
    if (left > 0 && (stack.length === 0 || g.int(0, 1))) { const k = g.int(0, 2); out.push(open[k]); stack.push(k); left--; }
    else out.push(close[stack.pop()]);
  }
  return out.join("");
};

export default (g) => {
  const ok = balanced(g, 50000);
  return [
    [ok],
    [ok.slice(0, -1) + (ok.endsWith(")") ? "]" : ")")],
    ["(".repeat(50000) + ")".repeat(50000)],
    ["[".repeat(100000)],
  ];
};
