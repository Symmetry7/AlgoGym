function countTargetStretches(changes, target) {
  const seen = new Map([[0, 1]]);
  let total = 0;
  let count = 0;
  for (const c of changes) {
    total += c;
    count += seen.get(total - target) ?? 0;
    seen.set(total, (seen.get(total) ?? 0) + 1);
  }
  return count;
}
