"use client";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MeasuredChartContainer as ResponsiveContainer } from "./MeasuredChartContainer";
const tooltipStyle = {
  background: "#151820",
  border: "1px solid #303746",
  borderRadius: 6,
  fontSize: 12,
  color: "#E8EDF5",
};
export function RatingChart({
  history,
  provider,
}: {
  history: Array<{
    provider: string;
    date: string;
    contestId: string;
    contestName?: string | null;
    contestRank?: number | null;
    rating: number;
    before: number | null;
  }>;
  provider: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const data = history
    .filter((item) => item.provider === provider)
    .filter((item) => Number.isFinite(item.rating) && Number.isFinite(Date.parse(item.date)))
    .map((item) => ({ ...item, timestamp: Date.parse(item.date) }))
    .sort((a, b) => a.timestamp - b.timestamp);
  if (!data.length)
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed px-6 text-center text-sm leading-6 text-muted-foreground">
        No synchronized rated contests are available for this platform and date
        range.
      </div>
    );
  const firstTime = data[0].timestamp;
  const lastTime = data.at(-1)!.timestamp;
  const minRating = 0;
  const maxRating = Math.ceil((Math.max(...data.map((item) => item.rating)) + 100) / 200) * 200;
  const left = 46;
  const right = 982;
  const top = 16;
  const bottom = 280;
  const points = data.map((item, index) => ({
    ...item,
    x: firstTime === lastTime ? (left + right) / 2 : left + (item.timestamp - firstTime) / (lastTime - firstTime) * (right - left),
    y: bottom - (item.rating - minRating) / (maxRating - minRating) * (bottom - top),
    index,
  }));
  const gridRatings = Array.from({ length: 5 }, (_, index) => index * maxRating / 4);
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  return (
    <>
      <div
        className="relative h-64 w-full sm:h-80"
        role="img"
        aria-label={`${provider} contest rating history with ${data.length} rated contests. Latest rating ${data.at(-1)?.rating}.`}
      >
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          {gridRatings.map((rating) => {
            const y = bottom - rating / maxRating * (bottom - top);
            return <g key={rating}><line x1={left} x2={right} y1={y} y2={y} stroke="#34343f" strokeWidth="1" vectorEffect="non-scaling-stroke" /><text x="0" y={y + 4} fill="#aaa8ba" fontSize="11">{rating}</text></g>;
          })}
          <path d={path} fill="none" stroke="#b8a0f4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {points.map((point) => <circle key={point.contestId} cx={point.x} cy={point.y} r={data.length > 40 ? 5 : 6} fill={active === point.index ? "#f8f7fc" : "#b8a0f4"} stroke="#1d1d25" strokeWidth="2" vectorEffect="non-scaling-stroke" tabIndex={0} aria-label={`${point.contestName || `Contest ${point.contestId}`}, ${new Date(point.date).toLocaleDateString()}, rating ${point.rating}`} onMouseEnter={() => setActive(point.index)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(point.index)} onBlur={() => setActive(null)} />)}
        </svg>
        {active !== null && points[active] && <div className="pointer-events-none absolute z-10 max-w-64 rounded-lg border border-[#34343f] bg-[#1d1d25] p-3 text-xs shadow-xl" style={{ left: `${Math.min(82, Math.max(18, points[active].x / 10))}%`, top: `${Math.max(0, points[active].y / 3 - 35)}%`, transform: "translate(-50%, -100%)" }}><p className="font-medium text-foreground">{points[active].contestName || `Contest ${points[active].contestId}`}</p><p className="mt-1 text-muted-foreground">{new Date(points[active].date).toLocaleDateString()} {typeof points[active].contestRank === "number" ? `· Rank ${points[active].contestRank?.toLocaleString()}` : ""}</p><p className="mt-2 tabular-nums text-foreground">Rating {points[active].rating} {points[active].before !== null ? `(${points[active].rating - points[active].before >= 0 ? "+" : ""}${points[active].rating - points[active].before})` : ""}</p></div>}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <time dateTime={data[0].date}>{new Date(data[0].date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</time>
        {data.length > 1 && <time dateTime={data.at(-1)!.date}>{new Date(data.at(-1)!.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</time>}
      </div>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          View contest data
        </summary>
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Contest</th>
                <th className="py-2 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.contestId} className="border-t">
                  <td className="py-2">{row.date.slice(0, 10)}</td>
                  <td>{row.contestName || `Contest ${row.contestId}`}</td>
                  <td>{Math.round(row.rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
export function ChakraChart({
  data,
}: {
  data: Array<{ date: string; points: number }>;
}) {
  if (!data.length)
    return (
      <div className="flex h-44 items-center justify-center px-4 text-center text-sm leading-6 text-muted-foreground">
        No coin entries for this period. Eligible accepted solves will appear
        here.
      </div>
    );
  return (
    <div
      className="h-48 w-full"
      role="img"
      aria-label={`Daily Coins earning history across ${data.length} days`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 4, left: -20 }}
        >
          <CartesianGrid stroke="#252A36" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            tick={{ fill: "#98A2B3", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#98A2B3", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [value, "Coins"]}
          />
          <Line
            type="linear"
            dataKey="points"
            stroke="#A78BFA"
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Distribution({
  items,
  empty = "No accepted solves in this period.",
}: {
  items: Array<{ label: string; count: number }>;
  empty?: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  if (!items.length)
    return <p className="py-5 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex justify-between gap-4 text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="tabular-nums">{item.count.toLocaleString()}</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded bg-muted"
            aria-hidden="true"
          >
            <div
              className="h-full rounded bg-[#8e77c6]"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
