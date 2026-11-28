import type { Diagram, DiagramNode } from "./lessons";

/* Lays out an <ArchDiagram> on its grid. "wide" puts the flow left to right; "tall" transposes it
   (grid x becomes the row), so the same diagram reads top to bottom on a phone. Links are orthogonal:
   out of one face, one elbow halfway, into the facing face, with rounded corners. */

export type Orientation = "wide" | "tall";
export type PlacedNode = DiagramNode & { px: number; py: number; w: number; h: number };
export type PlacedEdge = { index: number; d: string; head: string; labelX: number; labelY: number; label?: string; async: boolean };
export type Layout = { width: number; height: number; font: number; icon: boolean; nodes: PlacedNode[]; edges: PlacedEdge[] };

const SIZES = {
  // main = spacing along the flow, cross = across it; node w/h are on-screen width and height.
  wide: { main: 216, cross: 100, w: 148, h: 54, pad: 16, font: 12.5, icon: true },
  tall: { main: 104, cross: 124, w: 116, h: 48, pad: 8, font: 13, icon: false },
} as const;
const PORT_GAP = 10;
const RADIUS = 10;

type Point = [number, number];

/** SVG path through the points with each corner rounded (radius capped by the shorter neighbouring segment). */
export function roundedPath(points: Point[], radius = RADIUS): string {
  // Drop repeated points and points on a straight run: only real corners get rounded.
  const unique = points.filter((p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
  const pts = unique.filter((p, i) => {
    if (i === 0 || i === unique.length - 1) return true;
    const [a, b] = [unique[i - 1], unique[i + 1]];
    return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
  });
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const r = Math.min(radius, Math.hypot(x - px, y - py) / 2, Math.hypot(nx - x, ny - y) / 2);
    const ax = x - Math.sign(x - px) * r, ay = y - Math.sign(y - py) * r;
    const bx = x + Math.sign(nx - x) * r, by = y + Math.sign(ny - y) * r;
    d += ` L ${ax} ${ay} Q ${x} ${y} ${bx} ${by}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last[0]} ${last[1]}`;
}

/** A small filled triangle whose tip sits on `to`, pointing along from → to. */
export function arrowHead(from: Point, to: Point, size = 6): string {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const [dx, dy] = [(to[0] - from[0]) / len, (to[1] - from[1]) / len];
  const [bx, by] = [to[0] - dx * size, to[1] - dy * size];
  const r = (n: number) => Math.round(n * 100) / 100;
  return `M ${r(to[0])} ${r(to[1])} L ${r(bx - dy * size * 0.55)} ${r(by + dx * size * 0.55)} L ${r(bx + dy * size * 0.55)} ${r(by - dx * size * 0.55)} Z`;
}

/** Whether the axis-aligned segment p → q passes through the box centred on c (with a small margin). */
function crosses(p: Point, q: Point, c: Point, uSize: number, vSize: number, margin = 4): boolean {
  const [u0, u1] = [Math.min(p[0], q[0]), Math.max(p[0], q[0])];
  const [v0, v1] = [Math.min(p[1], q[1]), Math.max(p[1], q[1])];
  return u1 > c[0] - uSize / 2 - margin && u0 < c[0] + uSize / 2 + margin && v1 > c[1] - vSize / 2 - margin && v0 < c[1] + vSize / 2 + margin;
}

export function layoutDiagram(diagram: Diagram, orientation: Orientation): Layout {
  const s = SIZES[orientation];
  const wide = orientation === "wide";
  const cols = Math.max(...diagram.nodes.map((n) => n.x)) + 1;
  const rows = Math.max(...diagram.nodes.map((n) => n.y)) + 1;
  // In (u, v) space u runs along the flow (grid x) and v across it (grid y); `toXY` maps to the screen.
  const uSize = wide ? s.w : s.h;
  const vSize = wide ? s.h : s.w;
  const toXY = (u: number, v: number): Point => (wide ? [u, v] : [v, u]);
  const centre = (n: DiagramNode): Point => [s.pad + n.x * s.main + uSize / 2, s.pad + n.y * s.cross + vSize / 2];

  const nodes: PlacedNode[] = diagram.nodes.map((n) => {
    const [cu, cv] = centre(n);
    const [px, py] = toXY(cu - uSize / 2, cv - vSize / 2);
    return { ...n, px, py, w: s.w, h: s.h };
  });
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));

  // Spread links that share a node face so they don't sit on top of each other, ordered by where the
  // other end sits so they never cross; the middle link of an odd fan stays straight.
  const faceOf = (a: DiagramNode, b: DiagramNode) =>
    a.x !== b.x ? (b.x > a.x ? "end" : "start") : b.y > a.y ? "below" : "above";
  const faces = new Map<string, { edge: number; rank: number }[]>();
  diagram.edges.forEach((e, edge) => {
    const a = byId.get(e.from)!, b = byId.get(e.to)!;
    for (const [n, o] of [[a, b], [b, a]]) {
      const key = `${n.id}:${faceOf(n, o)}`;
      const rank = n.x !== o.x ? o.y * 10 + o.x : o.x * 10 + o.y;
      faces.set(key, [...(faces.get(key) ?? []), { edge, rank }]);
    }
  });
  for (const list of faces.values()) list.sort((p, q) => p.rank - q.rank || p.edge - q.edge);
  const offset = (node: DiagramNode, other: DiagramNode, edge: number) => {
    const list = faces.get(`${node.id}:${faceOf(node, other)}`)!;
    // Centre the fan on the link whose far end sits straight across, if there is one, so that link stays straight.
    const crossOf = (n: DiagramNode) => (n.x !== node.x ? n.y : n.x);
    const aligned = list.findIndex((f) => {
      const e = diagram.edges[f.edge];
      const far = byId.get(e.from === node.id ? e.to : e.from)!;
      return crossOf(far) === (other.x !== node.x ? node.y : node.x);
    });
    const middle = aligned >= 0 ? aligned : (list.length - 1) / 2;
    return (list.findIndex((f) => f.edge === edge) - middle) * PORT_GAP;
  };

  const edges: PlacedEdge[] = diagram.edges.map((e, index) => {
    const a = byId.get(e.from)!, b = byId.get(e.to)!;
    const [au, av] = centre(a);
    const [bu, bv] = centre(b);
    let pts: Point[];
    if (a.x !== b.x) {
      const dir = Math.sign(b.x - a.x);
      const u1 = au + (dir * uSize) / 2, u2 = bu - (dir * uSize) / 2;
      const v1 = av + offset(a, b, index), v2 = bv + offset(b, a, index);
      // Elbow in the gap just past the source, else just before the target: the first that crosses no other box.
      const gap = (s.main - uSize) / 2;
      const route = (um: number): Point[] => [[u1, v1], [um, v1], [um, v2], [u2, v2]];
      const clear = (p: Point[]) => !diagram.nodes.some((n) => n !== a && n !== b && p.slice(1).some((q, i) => crosses(p[i], q, centre(n), uSize, vSize)));
      pts = [u1 + dir * gap, u2 - dir * gap].map(route).find(clear) ?? route((u1 + u2) / 2);
    } else {
      const dir = Math.sign(b.y - a.y);
      const u1 = au + offset(a, b, index), u2 = bu + offset(b, a, index);
      const v1 = av + (dir * vSize) / 2, v2 = bv - (dir * vSize) / 2;
      const vm = (v1 + v2) / 2;
      pts = [[u1, v1], [u1, vm], [u2, vm], [u2, v2]];
    }
    const screen = pts.map(([u, v]) => toXY(u, v));
    // Labels sit on the elbow; on a straight run they sit just above the line, clear of any elbow crossing it.
    const straight = screen[1][0] === screen[2][0] && screen[1][1] === screen[2][1];
    const mid: Point = straight && wide ? [screen[1][0], screen[1][1] - 13] : [(screen[1][0] + screen[2][0]) / 2, (screen[1][1] + screen[2][1]) / 2];
    // Tall drawings leave only a narrow gap between side-by-side nodes: no room for a label there (the text version keeps it).
    const label = !wide && a.x === b.x ? undefined : e.label;
    return { index, d: roundedPath(screen), head: arrowHead(screen[2], screen[3]), labelX: mid[0], labelY: mid[1], label, async: e.async === true };
  });

  const [width, height] = toXY(2 * s.pad + (cols - 1) * s.main + uSize, 2 * s.pad + (rows - 1) * s.cross + vSize);
  return { width, height, font: s.font, icon: s.icon, nodes, edges };
}
