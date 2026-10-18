import { describe, it, expect } from "vitest";
import {
  monthGrid,
  eventOnDate,
  contestICS,
  parseAtCoderEvents,
  type ContestEvent,
} from "./contest-calendar";
const event: ContestEvent = {
  id: "event",
  provider: "codeforces",
  external_id: "42",
  title: "Contest, one;\nline",
  url: "https://codeforces.com/contest/42",
  starts_at: "2026-10-17T23:00:00Z",
  ends_at: "2026-10-18T01:00:00Z",
  fetched_at: "2026-10-17T00:00:00Z",
  subscribers: 0,
};
describe("contest calendar", () => {
  it("builds complete six-week month grids", () => {
    const grid = monthGrid(new Date(2026, 9, 17));
    expect(grid).toHaveLength(42);
    expect(grid[0].getDay()).toBe(0);
    expect(grid.filter((day) => day.getMonth() === 9)).toHaveLength(31);
  });
  it("uses end-exclusive local date boundaries", () => {
    const local = {
      ...event,
      starts_at: new Date(2026, 9, 17, 23).toISOString(),
      ends_at: new Date(2026, 9, 18, 1).toISOString(),
    };
    expect(eventOnDate(local, new Date(2026, 9, 17))).toBe(true);
    expect(eventOnDate(local, new Date(2026, 9, 18))).toBe(true);
    expect(eventOnDate(local, new Date(2026, 9, 19))).toBe(false);
  });
  it("exports UTC calendar events with escaped text and a local reminder", () => {
    const ics = contestICS([event]);
    expect(ics).toContain("DTSTART:20261017T230000Z");
    expect(ics).toContain("SUMMARY:Contest\\, one\\;\\nline");
    expect(ics).toContain("TRIGGER:-PT15M");
    expect(ics).toContain("END:VCALENDAR\r\n");
  });
  it("parses only valid public active/upcoming AtCoder rows", () => {
    const html =
      '<div id="contest-table-upcoming"><table><tr><td><time>2026-10-17 21:00:00+0900</time></td><td><a href="/contests/abc480">AtCoder &amp; example</a></td><td>01:40</td></tr></table></div>';
    expect(parseAtCoderEvents(html)[0]).toMatchObject({
      external_id: "abc480",
      title: "AtCoder & example",
      starts_at: "2026-10-17T12:00:00.000Z",
      ends_at: "2026-10-17T13:40:00.000Z",
    });
    expect(parseAtCoderEvents("<html>Changed markup</html>")).toEqual([]);
  });
});
