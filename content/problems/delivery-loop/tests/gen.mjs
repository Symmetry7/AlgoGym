export const seed = 3111;

const chain = (g, n) => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = g.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const next = Array(n).fill(-1);
  for (let i = 0; i + 1 < n; i++) next[order[i]] = order[i + 1];
  return { next, head: order[0] };
};

// A route of n stops in random order: a tail of length tail, then a loop through the rest.
const rho = (g, n, tail) => {
  const c = chain(g, n);
  const order = [];
  for (let s = c.head; s !== -1; s = c.next[s]) order.push(s);
  c.next[order[n - 1]] = order[tail];
  return c;
};

export default (g) => {
  const n = 100000;
  // Tail and loop lengths differ, so the walkers meet away from the loop start.
  const half = rho(g, n, 31234);
  const longTail = rho(g, n, n - 1);
  const noLoop = chain(g, n);
  const whole = rho(g, n, 0);
  return [[half.next, half.head], [longTail.next, longTail.head], [noLoop.next, noLoop.head], [whole.next, whole.head]];
};
