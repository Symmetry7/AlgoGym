import { createClient } from "@supabase/supabase-js";
import type { InterviewItem } from "@/lib/interview-items";
import { getSupabaseEnv } from "./supabase";

const COLUMNS = "id, kind, question, answer_md, tags, companies, roles, difficulty, reference_url, position";

/** All HR and SQL items (~210 rows), read with the publishable key: interview_items is public content under RLS. */
export async function listInterviewItems(): Promise<InterviewItem[]> {
  const { url, key } = getSupabaseEnv();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("interview_items").select(COLUMNS).order("kind").order("position").limit(2000);
  if (error) throw new Error(`Could not load interview questions: ${error.message}`);
  return data as InterviewItem[];
}
