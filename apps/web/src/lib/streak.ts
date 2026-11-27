// Solve streaks from YYYY-MM-DD (IST) days. Pure, so it's unit-tested.
const shift = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * 86_400_000).toISOString().slice(0, 10);

/** Consecutive days ending today, or yesterday if today has no solve yet (the streak isn't broken until the day ends). */
export function currentStreak(days: Set<string>, today: string) {
  let d = days.has(today) ? today : shift(today, -1);
  let n = 0;
  while (days.has(d)) { n++; d = shift(d, -1); }
  return n;
}

export function longestStreak(days: Set<string>) {
  let best = 0;
  for (const d of days) {
    if (days.has(shift(d, -1))) continue; // only count from the first day of each run
    let n = 1;
    while (days.has(shift(d, n))) n++;
    best = Math.max(best, n);
  }
  return best;
}
