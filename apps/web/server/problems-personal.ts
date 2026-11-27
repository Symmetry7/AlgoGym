import "server-only";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "./session";
import { getSupabaseEnv } from "./supabase";

export interface Personal {
  signedIn: boolean;
  solved: Set<string>; // problem ids
  solvedDays: Set<string>; // YYYY-MM-DD (IST) with at least one solve
  favorites: Set<string>; // bookmarked problem ids
  lists: { id: string; name: string; items: string[] }[];
}

export const EMPTY: Personal = { signedIn: false, solved: new Set(), solvedDays: new Set(), favorites: new Set(), lists: [] };

// India Standard Time date for streaks and the daily problem.
export const istDate = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** The visitor's solved problems, favourites and lists. Every query runs as the visitor, so RLS keeps it to their rows. */
export async function getPersonal(): Promise<Personal> {
  const { db, user } = await currentUser();
  if (!db || !user) return EMPTY;
  const [status, bookmarks, lists, items] = await Promise.all([
    db.from("user_problem_status").select("problem_id, solved_at").eq("status", "solved"),
    db.from("bookmarks").select("problem_id"),
    db.from("lists").select("id, name, created_at").order("created_at"),
    db.from("list_items").select("list_id, problem_id, position").order("position"),
  ]);
  for (const r of [status, bookmarks, lists, items]) if (r.error) throw new Error(`Could not load your progress: ${r.error.message}`);
  return {
    signedIn: true,
    solved: new Set(status.data!.map((r) => r.problem_id)),
    solvedDays: new Set(status.data!.filter((r) => r.solved_at).map((r) => istDate(new Date(r.solved_at!)))),
    favorites: new Set(bookmarks.data!.map((r) => r.problem_id)),
    lists: lists.data!.map((l) => ({ id: l.id, name: l.name, items: items.data!.filter((i) => i.list_id === l.id).map((i) => i.problem_id) })),
  };
}

/** daily_problems rows for one month (public content). */
export async function getDailyMonth(year: number, month: number) {
  const { url, key } = getSupabaseEnv();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const { data, error } = await db.from("daily_problems").select("date, problem_id").gte("date", start).lt("date", end);
  if (error) throw new Error(`Could not load daily problems: ${error.message}`);
  return new Map(data.map((d) => [d.date as string, d.problem_id as string]));
}
