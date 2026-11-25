import { describe, it, expect } from "vitest";
import { aggregateActivity } from "./analytics";
import type { TrackedSolve, LedgerEntry } from "../src/lib/tracker-types";
const solve = (id: string, date: string, tags = ["dp"]): TrackedSolve => ({
  id,
  problemId: id,
  title: id,
  provider: "codeforces",
  rating: 1500,
  difficulty: null,
  tags,
  url: "https://codeforces.com/",
  acceptedAt: date,
  chakra: null,
});
describe("verified analytics", () => {
  it("deduplicates problem identities, counts topic membership once, and uses UTC dates", () => {
    const row = solve("a", "2026-10-16T23:30:00Z", ["dp", "dp", "graphs"]);
    const result = aggregateActivity(
      [row, row, solve("b", "2026-09-01T00:00:00Z")],
      [],
      7,
      "all",
      true,
      Date.parse("2026-10-17T12:00:00Z"),
    );
    expect(result.overview.verifiedSolves).toBe(1);
    expect(result.topics).toEqual([
      { topic: "dp", count: 1 },
      { topic: "graphs", count: 1 },
    ]);
    expect(result.activity).toEqual([{ date: "2026-10-16", count: 1 }]);
  });
  it("does not claim a complete total while initial history is syncing", () => {
    expect(
      aggregateActivity([], [], 365, "all", false).overview.verifiedSolves,
    ).toBeNull();
  });
  it("derives balances including reversals and does not invent history", () => {
    const ledger: LedgerEntry[] = [
      {
        id: "a",
        delta: 40,
        createdAt: "2026-10-16T10:00:00Z",
        provider: "codeforces",
        difficulty: "1500",
      },
      {
        id: "b",
        delta: -40,
        createdAt: "2026-10-17T10:00:00Z",
        provider: "codeforces",
        difficulty: "1500",
      },
    ];
    expect(
      aggregateActivity(
        [],
        ledger,
        30,
        "all",
        true,
        Date.parse("2026-10-17T12:00:00Z"),
      ).overview.chakra,
    ).toBe(0);
    expect(aggregateActivity([], [], 30, "all", true).chakraHistory).toEqual(
      [],
    );
  });
});
