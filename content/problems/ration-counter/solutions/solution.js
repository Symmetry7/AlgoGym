function minCapacity(bags, days) {
  let lo = 0;
  let hi = 0;
  for (const b of bags) {
    lo = Math.max(lo, b);
    hi += b;
  }
  const daysNeeded = (cap) => {
    let used = 1;
    let load = 0;
    for (const b of bags) {
      if (load + b > cap) {
        used++;
        load = 0;
      }
      load += b;
    }
    return used;
  };
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (daysNeeded(mid) <= days) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
