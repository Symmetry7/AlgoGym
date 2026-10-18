import type { LedgerEntry, TrackedSolve } from "../src/lib/tracker-types";
export function aggregateActivity(
  solves: TrackedSolve[],
  ledger: LedgerEntry[],
  days: number,
  provider: string,
  historyComplete: boolean,
  now = Date.now(),
) {
  const start =
    days === 0
      ? -Infinity
      : Date.parse(
          new Date(now - (days - 1) * 86_400_000).toISOString().slice(0, 10),
        );
  const selected = [
    ...new Map(
      solves
        .filter(
          (solve) =>
            (provider === "all" || solve.provider === provider) &&
            Date.parse(solve.acceptedAt) >= start &&
            Date.parse(solve.acceptedAt) <= now,
        )
        .map((solve) => [solve.problemId, solve]),
    ).values(),
  ];
  const difficulty = new Map<string, number>();
  const topics = new Map<string, number>();
  const activity = new Map<string, number>();
  for (const solve of selected) {
    const label =
      solve.provider === "codeforces"
        ? solve.rating === null
          ? "Unrated"
          : `${Math.floor(solve.rating / 400) * 400}–${Math.floor(solve.rating / 400) * 400 + 399}`
        : (solve.difficulty ?? "Unknown");
    difficulty.set(label, (difficulty.get(label) ?? 0) + 1);
    for (const tag of new Set(solve.tags))
      topics.set(tag, (topics.get(tag) ?? 0) + 1);
    const day = solve.acceptedAt.slice(0, 10);
    activity.set(day, (activity.get(day) ?? 0) + 1);
  }
  const week = new Date(now);
  week.setUTCHours(0, 0, 0, 0);
  week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  const month = new Date(now);
  month.setUTCHours(0, 0, 0, 0);
  month.setUTCDate(1);
  const history = new Map<string, number>();
  const byProvider = new Map<string, number>();
  const byDifficulty = new Map<string, number>();
  let balance = 0,
    chakraWeek = 0,
    chakraMonth = 0;
  for (const entry of ledger) {
    if (Date.parse(entry.createdAt) > now) continue;
    balance += entry.delta;
    if (Date.parse(entry.createdAt) >= week.getTime())
      chakraWeek += entry.delta;
    if (Date.parse(entry.createdAt) >= month.getTime())
      chakraMonth += entry.delta;
    if (
      Date.parse(entry.createdAt) < start ||
      (provider !== "all" && entry.provider !== provider)
    )
      continue;
    const day = entry.createdAt.slice(0, 10);
    history.set(day, (history.get(day) ?? 0) + entry.delta);
    byProvider.set(
      entry.provider ?? "Adjustment",
      (byProvider.get(entry.provider ?? "Adjustment") ?? 0) + entry.delta,
    );
    byDifficulty.set(
      entry.difficulty ?? "Unrated",
      (byDifficulty.get(entry.difficulty ?? "Unrated") ?? 0) + entry.delta,
    );
  }
  return {
    overview: {
      verifiedSolves: historyComplete ? selected.length : null,
      knownSolves: selected.length,
      activeDays: historyComplete ? activity.size : null,
      chakra: balance,
      chakraWeek,
      chakraMonth,
    },
    difficulty: [...difficulty]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true }),
      ),
    topics: [...topics]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic)),
    activity: [...activity]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    chakraHistory: [...history]
      .map(([date, points]) => ({ date, points }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    chakraByProvider: [...byProvider].map(([label, points]) => ({
      label,
      points,
    })),
    chakraByDifficulty: [...byDifficulty].map(([label, points]) => ({
      label,
      points,
    })),
    recentSolves: selected
      .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt))
      .slice(0, 30),
  };
}
