export interface ContestEvent {
  id: string;
  provider: "codeforces" | "leetcode" | "codechef" | "atcoder";
  external_id: string;
  title: string;
  url: string;
  starts_at: string;
  ends_at: string;
  fetched_at: string;
  subscribers: number;
}
export interface ContestCalendarData {
  events: ContestEvent[];
  subscriptions: Array<{ id: string; event_id: string }>;
  warnings: string[];
  coverage: Record<string, string>;
}
export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function monthGrid(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  start.setDate(start.getDate() - start.getDay());
  return Array.from(
    { length: 42 },
    (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12),
  );
}
export function eventOnDate(event: ContestEvent, date: Date) {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  ).getTime();
  return Date.parse(event.starts_at) < end && Date.parse(event.ends_at) > start;
}
const escapeICS = (text: string) =>
  text
    .replaceAll("\\", "\\\\")
    .replaceAll("\r", "")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
export function contestICS(events: ContestEvent[], now = new Date()) {
  const timestamp = (value: string) =>
    new Date(value)
      .toISOString()
      .replaceAll("-", "")
      .replaceAll(":", "")
      .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AlgoGym//Contest Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.provider}-${event.external_id}@algogym.vercel.app`,
      `DTSTAMP:${timestamp(now.toISOString())}`,
      `DTSTART:${timestamp(event.starts_at)}`,
      `DTEND:${timestamp(event.ends_at)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `URL:${event.url}`,
      `DESCRIPTION:${escapeICS(`Coding contest on ${event.provider}. Source: ${event.url}`)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Contest starts in 15 minutes",
      "END:VALARM",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  // RFC 5545 folds physical lines at 75 UTF-8 octets without splitting characters.
  return (
    lines
      .flatMap((line) => {
        const parts: string[] = [];
        let current = "";
        let bytes = 0;
        for (const char of line) {
          const length = new TextEncoder().encode(char).length;
          if (bytes + length > 75) {
            parts.push(current);
            current = " ";
            bytes = 1;
          }
          current += char;
          bytes += length;
        }
        parts.push(current);
        return parts;
      })
      .join("\r\n") + "\r\n"
  );
}
export function parseAtCoderEvents(html: string) {
  const sections = ["upcoming", "active"].flatMap(
    (name) =>
      html.split(`id="contest-table-${name}"`)[1]?.split("</table>")[0] ?? [],
  );
  const rows = sections.flatMap(
    (section) => section.match(/<tr>[\s\S]*?<\/tr>/g) ?? [],
  );
  const decode = (value: string) =>
    value
      .replace(/<[^>]*>/g, "")
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .trim();
  return rows.flatMap((row) => {
    const time = row.match(/<time[^>]*>([^<]+)<\/time>/);
    const link = row.match(
      /<a href="\/contests\/([a-zA-Z0-9_-]+)">([\s\S]*?)<\/a>/,
    );
    const duration = row.match(/<td[^>]*>\s*(\d{1,4}):(\d{2})\s*<\/td>/);
    if (!time || !link || !duration) return [];
    const start = Date.parse(
      time[1].replace(" ", "T").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"),
    );
    const seconds = (Number(duration[1]) * 60 + Number(duration[2])) * 60;
    if (!Number.isFinite(start) || seconds <= 0) return [];
    return [
      {
        provider: "atcoder" as const,
        external_id: link[1],
        title: decode(link[2]),
        url: `https://atcoder.jp/contests/${link[1]}`,
        starts_at: new Date(start).toISOString(),
        ends_at: new Date(start + seconds * 1000).toISOString(),
      },
    ];
  });
}
