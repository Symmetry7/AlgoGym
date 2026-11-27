import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./supabase";

/**
 * A Supabase client acting as the signed-in visitor (RLS applies), for server components and actions.
 * Server components can't set cookies; src/proxy.ts refreshes the session on every request instead.
 */
export async function visitorSupabase() {
  const store = await cookies();
  const { url, key } = getSupabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { for (const { name, value, options } of list) store.set(name, value, options); } catch { /* read-only in server components */ }
      },
    },
  });
}

export async function currentUser() {
  const store = await cookies();
  if (!store.getAll().some((c) => c.name.startsWith("sb-"))) return { db: null, user: null }; // no session cookie: skip the auth round trip
  const db = await visitorSupabase();
  const { data } = await db.auth.getUser();
  return { db, user: data.user ?? null };
}
