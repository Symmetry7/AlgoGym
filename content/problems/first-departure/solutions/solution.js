function firstDeparture(departures, arrival) {
  let lo = 0;
  let hi = departures.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (departures[mid] < arrival) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
