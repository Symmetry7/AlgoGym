"use client";

import { animate, stagger, svg } from "animejs";
import { useEffect, useRef } from "react";

// Hero backdrop: a faint system-design diagram (client → CDN → load balancer → services → cache/DB/queue → workers).
// anime.js draws the links in, then packets travel along them. Static and fully drawn with reduced motion.
const W = 152, H = 34;
const NODES: { id: string; label: string; x: number; y: number }[] = [
  { id: "client", label: "client", x: 40, y: 96 },
  { id: "cdn", label: "cdn · edge", x: 300, y: 40 },
  { id: "lb", label: "load balancer", x: 560, y: 96 },
  { id: "api1", label: "api · node 1", x: 820, y: 40 },
  { id: "api2", label: "api · node 2", x: 820, y: 152 },
  { id: "cache", label: "redis cache", x: 1100, y: 40 },
  { id: "db", label: "postgres primary", x: 1250, y: 210 },
  { id: "replica", label: "read replica", x: 1268, y: 470 },
  { id: "queue", label: "job queue", x: 1060, y: 760 },
  { id: "worker", label: "workers ×4", x: 1262, y: 820 },
  { id: "judge", label: "code runner", x: 780, y: 830 },
  { id: "store", label: "object store", x: 440, y: 800 },
  { id: "auth", label: "auth", x: 60, y: 760 },
];
const at = (id: string) => NODES.find((n) => n.id === id)!;
const right = (id: string) => [at(id).x + W, at(id).y + H / 2];
const left = (id: string) => [at(id).x, at(id).y + H / 2];
const bottom = (id: string) => [at(id).x + W / 2, at(id).y + H];
const top = (id: string) => [at(id).x + W / 2, at(id).y];
// Orthogonal link: horizontal, then vertical, then horizontal.
const link = ([x1, y1]: number[], [x2, y2]: number[]) => { const mx = (x1 + x2) / 2; return `M${x1} ${y1} H${mx} V${y2} H${x2}`; };
const vlink = ([x1, y1]: number[], [x2, y2]: number[]) => { const my = (y1 + y2) / 2; return `M${x1} ${y1} V${my} H${x2} V${y2}`; };

const EDGES = [
  link(right("client"), left("cdn")),
  link(right("cdn"), left("lb")),
  link(right("lb"), left("api1")),
  link(right("lb"), left("api2")),
  link(right("api1"), left("cache")),
  vlink(bottom("api2"), top("db")),
  vlink(bottom("db"), top("replica")),
  vlink(bottom("api2"), top("queue")),
  link(right("queue"), left("worker")),
  link(left("queue"), right("judge")),
  link(left("judge"), right("store")),
  vlink(bottom("client"), top("auth")),
];

export function SystemDiagram() {
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anims = [
      animate(svg.createDrawable(el.querySelectorAll(".sd-edge")), { draw: ["0 0", "0 1"], ease: "inOutQuad", duration: 1400, delay: stagger(110, { start: 300 }) }),
      animate(el.querySelectorAll(".sd-node"), { opacity: [0, 1], translateY: [6, 0], ease: "outExpo", duration: 900, delay: stagger(70, { start: 150 }) }),
      ...[...el.querySelectorAll<SVGPathElement>(".sd-edge")].map((path, i) =>
        animate(el.querySelector(`.sd-packet-${i}`)!, { ...svg.createMotionPath(path), opacity: [0, 1, 1, 0], ease: "inOutSine", duration: 2600 + (i % 4) * 400, delay: 1800 + i * 260, loop: true, loopDelay: 1400 + (i % 3) * 900 }),
      ),
    ];
    // Stop the loops while the hero is offscreen.
    const io = new IntersectionObserver(([e]) => anims.forEach((a) => (e.isIntersecting ? a.resume() : a.pause())));
    io.observe(el);
    return () => { io.disconnect(); anims.forEach((a) => a.revert()); };
  }, []);

  return (
    <svg ref={root} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden className="size-full">
      <defs>
        <pattern id="sd-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.07)" />
        </pattern>
      </defs>
      <rect width="1440" height="900" fill="url(#sd-grid)" />
      <g fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" strokeLinejoin="round">
        {EDGES.map((d, i) => <path key={i} className="sd-edge" d={d} />)}
      </g>
      {EDGES.map((_, i) => <circle key={i} className={`sd-packet-${i}`} r="2.6" cx="0" cy="0" fill="#34d399" opacity="0" />)}
      {NODES.map((n) => (
        // The outer group holds the position; anime.js animates only the inner one, so its transform can't clobber it.
        <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
          <g className="sd-node">
            <rect width={W} height={H} rx="8" fill="rgba(10,10,12,0.9)" stroke="rgba(255,255,255,0.16)" />
            <circle cx="14" cy={H / 2} r="3" fill="rgba(255,255,255,0.35)" />
            <text x="26" y={H / 2 + 4} fill="rgba(255,255,255,0.45)" fontSize="11.5" fontFamily="var(--font-geist-mono), monospace">{n.label}</text>
          </g>
        </g>
      ))}
    </svg>
  );
}
