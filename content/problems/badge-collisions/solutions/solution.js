function countSharedBadgePairs(badges) {
  const seen = new Map();
  let pairs = 0;
  for (const code of badges) {
    const earlier = seen.get(code) ?? 0;
    pairs += earlier;
    seen.set(code, earlier + 1);
  }
  return pairs;
}
