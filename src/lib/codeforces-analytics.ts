export interface CFSubmission {
  id: string;
  problemId: string;
  title: string;
  index: string;
  contestId: number | null;
  rating: number | null;
  tags: string[];
  verdict: string;
  language: string | null;
  runtime: number | null;
  memory: number | null;
  date: string;
  relativeSeconds: number | null;
  participantType: string | null;
  url: string;
}
export interface CFRating {
  contestId: string;
  name: string;
  rank: number | null;
  date: string;
  before: number | null;
  rating: number;
}
export interface CFStatistics {
  submissions: CFSubmission[];
  ratings: CFRating[];
  complete: boolean;
  handle: string | null;
  lastSyncedAt: string | null;
}
export const verdictLabels: Record<string, string> = {
  OK: "AC",
  WRONG_ANSWER: "WA",
  TIME_LIMIT_EXCEEDED: "TLE",
  RUNTIME_ERROR: "RE",
  MEMORY_LIMIT_EXCEEDED: "MLE",
  COMPILATION_ERROR: "CE",
  TESTING: "Pending",
  SKIPPED: "Skipped",
  CHALLENGED: "Hacked",
  IDLENESS_LIMIT_EXCEEDED: "ILE",
  FAILED: "Failed",
  PARTIAL: "Partial",
};
export function submissionSummary(rows: CFSubmission[]) {
  const accepted = rows.filter((row) => row.verdict === "OK");
  const unique = new Set(accepted.map((row) => row.problemId));
  const failed = new Map<string, number>();
  const tempo = new Map<string, number>();
  const verdicts = new Map<string, number>();
  for (const row of rows) {
    const day = row.date.slice(0, 10);
    tempo.set(day, (tempo.get(day) ?? 0) + 1);
    verdicts.set(row.verdict, (verdicts.get(row.verdict) ?? 0) + 1);
    if (row.verdict !== "OK" && row.verdict !== "TESTING")
      for (const tag of row.tags) failed.set(tag, (failed.get(tag) ?? 0) + 1);
  }
  const runtimes = accepted.flatMap((row) =>
    row.runtime === null ? [] : [row.runtime],
  );
  return {
    accepted: accepted.length,
    unique: unique.size,
    acRate: rows.length ? (accepted.length / rows.length) * 100 : null,
    attemptsPerSolve: unique.size ? rows.length / unique.size : null,
    fastest: runtimes.length ? Math.min(...runtimes) : null,
    failedTags: [...failed].sort((a, b) => b[1] - a[1]),
    tempo: [...tempo]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    verdicts: [...verdicts].map(([label, count]) => ({
      label: verdictLabels[label] ?? label,
      count,
    })),
  };
}
export interface SubmissionFilter {
  verdict: string;
  min: string;
  max: string;
  tag: string;
  language: string;
  search: string;
}
export function filterSubmissions(
  rows: CFSubmission[],
  filter: SubmissionFilter,
) {
  return rows.filter(
    (row) =>
      (!filter.verdict || row.verdict === filter.verdict) &&
      (!filter.min ||
        (row.rating !== null && row.rating >= Number(filter.min))) &&
      (!filter.max ||
        (row.rating !== null && row.rating <= Number(filter.max))) &&
      (!filter.tag || row.tags.includes(filter.tag)) &&
      (!filter.language || row.language === filter.language) &&
      (!filter.search ||
        `${row.title} ${row.contestId ?? ""}${row.index}`
          .toLowerCase()
          .includes(filter.search.toLowerCase())),
  );
}
export function toCSV(rows: CFSubmission[]) {
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return [
    [
      "Submission",
      "Problem",
      "Verdict",
      "Rating",
      "Tags",
      "Language",
      "Runtime (ms)",
      "Memory (bytes)",
      "Date (UTC)",
      "URL",
    ],
    ...rows.map((row) => [
      row.id,
      row.title,
      row.verdict,
      row.rating,
      row.tags.join("; "),
      row.language,
      row.runtime,
      row.memory,
      row.date,
      row.url,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export const rankBands = [
  { name: "Newbie", from: 0, to: 1200, color: "#808080" },
  { name: "Pupil", from: 1200, to: 1400, color: "#35a66b" },
  { name: "Specialist", from: 1400, to: 1600, color: "#25a9ae" },
  { name: "Expert", from: 1600, to: 1900, color: "#5488ff" },
  { name: "Candidate master", from: 1900, to: 2100, color: "#b26ad4" },
  { name: "Master", from: 2100, to: 2300, color: "#e8a544" },
  { name: "International master", from: 2300, to: 2400, color: "#d78238" },
  { name: "Grandmaster", from: 2400, to: 2600, color: "#e56565" },
  { name: "International grandmaster", from: 2600, to: 3000, color: "#ed4545" },
  { name: "Legendary grandmaster", from: 3000, to: 5000, color: "#db2727" },
];
