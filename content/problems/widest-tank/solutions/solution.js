function maxTankArea(heights) {
  let lo = 0;
  let hi = heights.length - 1;
  let best = 0;
  while (lo < hi) {
    best = Math.max(best, (hi - lo) * Math.min(heights[lo], heights[hi]));
    if (heights[lo] <= heights[hi]) lo++;
    else hi--;
  }
  return best;
}
