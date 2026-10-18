import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./supabase";
export function adminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Background synchronization is not configured.");
  return createClient(getSupabaseEnv().url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
