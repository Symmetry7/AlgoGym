import { describe, expect, it } from "vitest";
import { arrowHead, layoutDiagram, roundedPath } from "./arch-layout";
import type { Diagram } from "./lessons";

const node = (id: string, x: number, y: number) => ({ id, label: id, x, y, kind: "service" as const });
const diagram = (nodes: Diagram["nodes"], edges: Diagram["edges"]): Diagram => ({ id: "d", title: "t", description: "d", nodes, edges, steps: [] });

describe("roundedPath", () => {
  it("draws a straight line when there is no corner, and rounds each corner", () => {
    expect(roundedPath([[0, 0], [10, 0], [10, 0], [20, 0]])).toBe("M 0 0 L 20 0");
    expect(roundedPath([[0, 0], [50, 0], [50, 50]], 10)).toBe("M 0 0 L 40 0 Q 50 0 50 10 L 50 50");
  });
});

describe("arrowHead", () => {
  it("puts the tip on the end point", () => {
    expect(arrowHead([0, 0], [100, 0]).startsWith("M 100 0")).toBe(true);
  });
});

describe("layoutDiagram", () => {
  const d = diagram([node("a", 0, 1), node("b", 1, 1), node("c", 2, 1), node("top", 1, 0)], [
    { from: "a", to: "c" }, // spans two columns, past b
    { from: "a", to: "b" },
    { from: "b", to: "top" },
  ]);

  it("lays the flow left to right when wide and top to bottom when tall", () => {
    const wide = layoutDiagram(d, "wide");
    const tall = layoutDiagram(d, "tall");
    expect(wide.width).toBeGreaterThan(wide.height);
    expect(tall.height).toBeGreaterThan(tall.width);
    const [a, c] = [wide.nodes[0], wide.nodes[2]];
    expect(c.px).toBeGreaterThan(a.px);
    expect(tall.nodes[2].py).toBeGreaterThan(tall.nodes[0].py);
  });

  it("drops labels on side-by-side links in the tall drawing only", () => {
    const labelled = diagram([node("a", 0, 0), node("b", 0, 1)], [{ from: "a", to: "b", label: "x" }]);
    expect(layoutDiagram(labelled, "wide").edges[0].label).toBe("x");
    expect(layoutDiagram(labelled, "tall").edges[0].label).toBeUndefined();
  });

  it("keeps the middle link of a fan straight and spreads the others", () => {
    const fan = diagram([node("s", 0, 1), node("u", 1, 0), node("m", 1, 1), node("l", 1, 2)], [
      { from: "s", to: "l" },
      { from: "s", to: "m" },
      { from: "s", to: "u" },
    ]);
    const edges = layoutDiagram(fan, "wide").edges;
    const startY = (d: string) => Number(d.split(" ")[2]);
    expect(startY(edges[2].d)).toBeLessThan(startY(edges[1].d));
    expect(startY(edges[1].d)).toBeLessThan(startY(edges[0].d));
    expect(edges[1].d.includes("Q")).toBe(false);
  });
});
