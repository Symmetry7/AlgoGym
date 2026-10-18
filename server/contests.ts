import "server-only";
import { adminSupabase } from "./admin";
import { codeforces } from "./providers";
import { parseAtCoderEvents } from "../src/lib/contest-calendar";
type EventRecord = {
  provider: string;
  external_id: string;
  title: string;
  url: string;
  starts_at: string;
  ends_at: string;
};
const providers = ["codeforces", "leetcode", "codechef", "atcoder"] as const;
async function publicJSON(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Provider unavailable");
  const json = await response.json();
  if (json.errors?.length) throw new Error("Unreadable provider response");
  return json;
}
async function fetchProvider(
  provider: (typeof providers)[number],
): Promise<EventRecord[]> {
  if (provider === "codeforces") {
    const rows = await codeforces("contest.list");
    return rows
      .filter(
        (row: any) =>
          Number.isFinite(row.startTimeSeconds) && row.durationSeconds > 0,
      )
      .map((row: any) => ({
        provider,
        external_id: String(row.id),
        title: row.name,
        url: `https://codeforces.com/contest/${row.id}`,
        starts_at: new Date(row.startTimeSeconds * 1000).toISOString(),
        ends_at: new Date(
          (row.startTimeSeconds + row.durationSeconds) * 1000,
        ).toISOString(),
      }));
  }
  if (provider === "leetcode") {
    const body = await publicJSON("https://leetcode.com/graphql/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "query { allContests { title titleSlug startTime duration } }",
      }),
    });
    if (!Array.isArray(body.data?.allContests))
      throw new Error("Unreadable contest list");
    return body.data.allContests
      .filter(
        (row: any) =>
          /^[a-z0-9-]+$/.test(row.titleSlug) &&
          Number.isFinite(row.startTime) &&
          row.duration > 0,
      )
      .map((row: any) => ({
        provider,
        external_id: row.titleSlug,
        title: row.title,
        url: `https://leetcode.com/contest/${row.titleSlug}/`,
        starts_at: new Date(row.startTime * 1000).toISOString(),
        ends_at: new Date((row.startTime + row.duration) * 1000).toISOString(),
      }));
  }
  if (provider === "codechef") {
    const body = await publicJSON(
      "https://www.codechef.com/api/list/contests/all",
    );
    if (!Array.isArray(body.future_contests))
      throw new Error("Unreadable contest list");
    return [
      ...body.future_contests,
      ...(body.present_contests ?? []),
      ...(body.past_contests ?? []),
    ]
      .filter(
        (row: any) =>
          /^[A-Za-z0-9]+$/.test(row.contest_code) &&
          Number.isFinite(Date.parse(row.contest_start_date_iso)) &&
          Date.parse(row.contest_end_date_iso) >
            Date.parse(row.contest_start_date_iso),
      )
      .map((row: any) => ({
        provider,
        external_id: row.contest_code,
        title: row.contest_name,
        url: `https://www.codechef.com/${row.contest_code}`,
        starts_at: new Date(row.contest_start_date_iso).toISOString(),
        ends_at: new Date(row.contest_end_date_iso).toISOString(),
      }));
  }
  const response = await fetch("https://atcoder.jp/contests/?lang=en", {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("AtCoder unavailable");
  const rows = parseAtCoderEvents(await response.text());
  if (!rows.length)
    throw new Error("No readable public active/upcoming AtCoder rows");
  return rows;
}
let pending: Promise<string[]> | null = null;
export async function refreshContestCatalog() {
  if (pending) return pending;
  pending = (async () => {
    const db = adminSupabase();
    const statuses = await Promise.all(
      providers.map(async (provider) => {
        try {
          const { data, error } = await db
            .from("contest_events")
            .select("fetched_at")
            .eq("provider", provider)
            .order("fetched_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) throw error;
          if (data && Date.now() - Date.parse(data.fetched_at) < 900000)
            return null;
          const rows = await fetchProvider(provider);
          if (!rows.length) throw new Error("Empty schedule");
          const unique = [
            ...new Map(rows.map((row) => [row.external_id, row])).values(),
          ];
          for (let offset = 0; offset < unique.length; offset += 400) {
            const { error } = await db.from("contest_events").upsert(
              unique
                .slice(offset, offset + 400)
                .map((row) => ({
                  ...row,
                  fetched_at: new Date().toISOString(),
                })),
              { onConflict: "provider,external_id" },
            );
            if (error) throw error;
          }
          return null;
        } catch {
          return `${provider} could not refresh. Previously saved events, if available, are retained.`;
        }
      }),
    );
    return statuses.filter((status): status is string => Boolean(status));
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
