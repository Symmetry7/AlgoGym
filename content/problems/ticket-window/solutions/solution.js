function countOpenedBy(times, queries) {
  const upperBound = (q) => {
    let lo = 0;
    let hi = times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= q) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return queries.map(upperBound);
}
