function largestSide(area) {
  let lo = 0;
  let hi = Math.min(area, 31622777);
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (mid * mid <= area) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
