function longestQuietRun(levels, limit) {
  let best = 0;
  let current = 0;
  for (const level of levels) {
    current = level <= limit ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}
