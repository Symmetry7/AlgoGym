function minDailyLoad(pages, days) {
  const fits = (limit) => {
    let used = 1;
    let today = 0;
    for (const p of pages) {
      if (today + p > limit) {
        used++;
        today = 0;
      }
      today += p;
    }
    return used <= days;
  };
  let lo = Math.max(...pages);
  let hi = pages.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
