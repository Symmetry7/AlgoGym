// Optional: seeded max-size tests. `npm run content:gen -- <folder>` writes them as tests/hidden/gNN.in/.out
// (outputs from the JavaScript reference solution). Each item is one argument list. Helpers: packages/judge/src/gen.mjs.
export const seed = 20261126;

export default (g) => [
  // Largest input, every reading quiet: the answer is the whole length.
  [g.arr(100000, 0, 5000), 10000],
  // Largest input, random readings around the limit.
  [g.arr(100000, 0, 10000), 5000],
];
