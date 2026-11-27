function canCross(reach) {
  let farthest = 0;
  for (let i = 0; i < reach.length; i++) {
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + reach[i]);
  }
  return true;
}
