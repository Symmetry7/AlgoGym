import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RatingChart } from "./Charts";

describe("Codeforces rating plot", () => {
  it("places official ratings on a proportional time and numeric rating scale", () => {
    const html = renderToStaticMarkup(
      <RatingChart
        provider="codeforces"
        history={[
          { provider: "codeforces", date: "2026-01-01T00:00:00Z", contestId: "1", rating: 1000, before: 900 },
          { provider: "codeforces", date: "2026-01-02T00:00:00Z", contestId: "2", rating: 800, before: 1000 },
          { provider: "codeforces", date: "2026-01-11T00:00:00Z", contestId: "3", rating: 1200, before: 800 },
        ]}
      />,
    );
    const coordinates = [...html.matchAll(/<circle[^>]*cx="([\d.]+)" cy="([\d.]+)"/g)]
      .map(([, x, y]) => ({ x: Number(x), y: Number(y) }));
    expect(coordinates).toHaveLength(3);
    expect((coordinates[2].x - coordinates[1].x) / (coordinates[1].x - coordinates[0].x)).toBeCloseTo(9);
    expect(coordinates[1].y).toBeGreaterThan(coordinates[0].y);
    expect(coordinates[2].y).toBeLessThan(coordinates[0].y);
  });

  it("renders rank bands and a usable plot without the details table", () => {
    const html = renderToStaticMarkup(
      <RatingChart
        provider="codeforces"
        history={[
          { provider: "codeforces", date: "2026-01-01T00:00:00Z", contestId: "1", rating: 1250, before: 1150 },
          { provider: "codeforces", date: "2026-02-01T00:00:00Z", contestId: "2", rating: 1430, before: 1250 },
        ]}
        bands={[{ name: "Pupil", from: 1200, to: 1400, color: "#35a66b" }, { name: "Specialist", from: 1400, to: 1600, color: "#25a9ae" }]}
        showDetails={false}
      />,
    );
    expect(html).toContain('fill="#35a66b"');
    expect(html).toContain('fill="#25a9ae"');
    expect(html).toContain('stroke="#b8a0f4"');
    expect(html).not.toContain("View contest data");
  });
});
