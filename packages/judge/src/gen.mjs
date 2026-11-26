// Seeded test-input generator. A problem may add `tests/gen.mjs`:
//   export const seed = 7;
//   export default (g) => [[g.arr(100000, -1e9, 1e9), 5], ...];   // each item is one argument list
// scripts/data/generate-tests.mjs writes them as tests/hidden/gNN.in with outputs from the reference solution.

// mulberry32, the same PRNG the C1/C2 build scripts used.
export function makeRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function helpers(seed) {
  const R = makeRng(seed);
  const int = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (xs) => xs[int(0, xs.length - 1)];
  return {
    random: R,
    int,
    pick,
    arr: (n, a, b) => Array.from({ length: n }, () => int(a, b)),
    word: (alphabet, lo, hi = lo) => Array.from({ length: int(lo, hi) }, () => pick(alphabet)).join(""),
    words: (n, alphabet, lo, hi = lo) => Array.from({ length: n }, () => Array.from({ length: int(lo, hi) }, () => pick(alphabet)).join("")),
    sorted: (xs) => [...xs].sort((x, y) => x - y),
  };
}

export const generateInputs = (genModule) => genModule.default(helpers(genModule.seed ?? 1));
