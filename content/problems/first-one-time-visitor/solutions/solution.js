function firstSingleVisit(visitors) {
  const count = new Map();
  for (const v of visitors) count.set(v, (count.get(v) ?? 0) + 1);
  for (let i = 0; i < visitors.length; i++) if (count.get(visitors[i]) === 1) return i;
  return -1;
}
