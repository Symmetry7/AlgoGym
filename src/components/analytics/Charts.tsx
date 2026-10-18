"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
    rating: number;
    before: number | null;
  }>;
  provider: string;
}) {
  const data = history
    .filter((item) => item.provider === provider)
    .map((item) => ({ ...item, timestamp: Date.parse(item.date) }));
  if (!data.length)
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed px-6 text-center text-sm leading-6 text-muted-foreground">
        No synchronized rated contests are available for this platform and date
        range.
      </div>
    );
  return (
    <>
      <div
        className="h-64 w-full sm:h-80"
        role="img"
        aria-label={`${provider} contest rating history with ${data.length} rated contests. Latest rating ${data.at(-1)?.rating}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 16, right: 12, bottom: 4, left: -20 }}
          >
            <CartesianGrid stroke="#252A36" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(undefined, {
                  month: "short",
                  year: "2-digit",
                })
              }
              tick={{ fill: "#98A2B3", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={45}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#98A2B3", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload;
                return active && row ? (
                  <div style={tooltipStyle} className="space-y-1 p-3">
                    <p>{new Date(row.date).toLocaleDateString()}</p>
                    <p className="text-muted-foreground">
                      Contest {row.contestId}
                    </p>
                    <p>
                      Rating {Math.round(row.rating)}
                      {row.before !== null
                        ? ` (${row.rating - row.before >= 0 ? "+" : ""}${row.rating - row.before})`
                        : ""}
                    </p>
                  </div>
                ) : null;
              }}
            />
            <Line
              type="linear"
              dataKey="rating"
              name="Rating"
              stroke="#A78BFA"
              strokeWidth={2}
              dot={
                data.length < 15
                  ? { r: 3, fill: "#A78BFA", strokeWidth: 0 }
                  : false
              }
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
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
                  <td>{row.contestId}</td>
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
        No Chakra entries for this period. Eligible verified solves will appear
        here.
      </div>
    );
  return (
    <div
      className="h-48 w-full"
      role="img"
      aria-label={`Daily Chakra earning history across ${data.length} days`}
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
            formatter={(value) => [value, "Chakra"]}
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
  empty = "No verified solves in this period.",
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
