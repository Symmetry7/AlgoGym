function countPairsWithTotal(amounts, target) {
  const seen = new Map();
  let pairs = 0;
  for (const x of amounts) {
    pairs += seen.get(target - x) ?? 0;
    seen.set(x, (seen.get(x) ?? 0) + 1);
  }
  return pairs;
}
