import { createClient } from "@supabase/supabase-js";
import type { InterviewItem, InterviewSheet, SheetQuestion, SheetSection } from "@/lib/interview-items";
import { getSupabaseEnv } from "./supabase";

const COLUMNS = "id, kind, question, answer_md, tags, companies, roles, difficulty, reference_url, position";

// interview_items and the question sheets are public content under RLS, so the publishable key is enough.
function client() {
  const { url, key } = getSupabaseEnv();
  return createClient(url, key, { auth: { persistSession: false } });
}

/** All HR and SQL items (~210 rows). */
export async function listInterviewItems(): Promise<InterviewItem[]> {
  const { data, error } = await client().from("interview_items").select(COLUMNS).order("kind").order("position").limit(2000);
  if (error) throw new Error(`Could not load interview questions: ${error.message}`);
  return data as InterviewItem[];
}

// A database without the 20261128120000 migration (production until launch) has no sheets yet: show none rather than fail.
const missingTable = (code?: string) => code === "PGRST205" || code === "42P01";

/** Every question sheet (~105 rows). provenance_url is not granted to clients and never selected. */
export async function listInterviewSheets(): Promise<InterviewSheet[]> {
  const { data, error } = await client().from("interview_sheets").select("section, slug, title, group_name, item_count, position").order("section").order("position");
  if (missingTable(error?.code)) return [];
  if (error) throw new Error(`Could not load question sheets: ${error.message}`);
  return data as InterviewSheet[];
}

type Row = Omit<SheetQuestion, "practice" | "answer"> & {
  practice: { slug: string; title: string } | null;
  answer: { kind: "hr" | "sql"; question: string } | null;
};

/** One sheet and its questions (at most ~750), with the original to practise each with and our answer where there is one. */
export async function getInterviewSheet(section: SheetSection, slug: string): Promise<{ sheet: InterviewSheet; questions: SheetQuestion[] } | null> {
  const db = client();
  const sheet = await db.from("interview_sheets").select("section, slug, title, group_name, item_count, position").eq("section", section).eq("slug", slug).maybeSingle();
  if (missingTable(sheet.error?.code)) return null;
  if (sheet.error) throw new Error(`Could not load the sheet: ${sheet.error.message}`);
  if (!sheet.data) return null;
  const rows = await db
    .from("interview_catalog")
    .select("id, position, title, difficulty, category, subcategory, level, practice:catalog_problems!interview_catalog_practice_problem_id_fkey(slug, title), answer:interview_items(kind, question)")
    .eq("section", section)
    .eq("sheet_slug", slug)
    .order("position")
    .order("id")
    .limit(2000);
  if (rows.error) throw new Error(`Could not load the sheet's questions: ${rows.error.message}`);
  return { sheet: sheet.data as InterviewSheet, questions: rows.data as unknown as Row[] };
}
