export type UpsolveProblem = {
  id: string;
  title: string;
  url: string;
  cf_rating: number | null;
  tags: string[] | null;
};

export type UpsolveSubmission = {
  problem_id: string | null;
  verdict: string;
  submitted_at: string;
  contest_id: number | null;
  problems: UpsolveProblem | null;
};

export function groupUpsolveAttempts(rows: UpsolveSubmission[]) {
  const attempts = new Map<string, {
    problem: UpsolveProblem;
    attempts: number;
    lastAttemptedAt: string;
    lastVerdict: string;
    contestId: number | null;
  }>();
  for (const row of rows) {
    const problem = row.problems;
    if (!row.problem_id || !problem?.url || row.verdict === "OK") continue;
    const current = attempts.get(row.problem_id);
    if (current) current.attempts += 1;
    else attempts.set(row.problem_id, {
      problem,
      attempts: 1,
      lastAttemptedAt: row.submitted_at,
      lastVerdict: row.verdict,
      contestId: row.contest_id,
    });
  }
  return attempts;
}

export function pendingUpsolves(
  attempts: ReturnType<typeof groupUpsolveAttempts>,
  solvedIds: ReadonlySet<string>,
  limit = 100,
) {
  return [...attempts.entries()]
    .filter(([id]) => !solvedIds.has(id))
    .map(([, item]) => item)
    .slice(0, limit);
}
