import { z } from "zod";
import { adminSupabase } from "../admin";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";

const stateSchema = z
  .object({
    questionId: z.string().regex(/^[a-z0-9-]{2,120}$/),
    completed: z.boolean(),
    bookmarked: z.boolean(),
  })
  .strict();
const companySchema = z
  .object({
    kind: z.literal("company"),
    slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000),
    published: z.boolean(),
    position: z.number().int().min(0).max(10000),
  })
  .strict();
const questionSchema = z
  .object({
    kind: z.literal("question"),
    id: z.string().regex(/^[a-z0-9-]{2,120}$/),
    title: z.string().trim().min(3).max(200),
    source: z.string().trim().min(2).max(60),
    url: z
      .string()
      .url()
      .refine((url) => url.startsWith("https://")),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).nullable(),
    tags: z.array(z.string().trim().min(1).max(40)).max(12),
    published: z.boolean(),
  })
  .strict();
const placementSchema = z
  .object({
    kind: z.literal("placement"),
    companySlug: z.string().regex(/^[a-z0-9-]{2,80}$/),
    questionId: z.string().regex(/^[a-z0-9-]{2,120}$/),
    position: z.number().int().min(0).max(10000),
    remove: z.boolean().optional(),
  })
  .strict();
const categoryPlacementSchema = z
  .object({
    kind: z.literal("categoryPlacement"),
    categorySlug: z.enum([
      "sql",
      "patterns",
      "package-wise",
      "system-design",
      "hr-questions",
      "interview-questions",
    ]),
    questionId: z.string().regex(/^[a-z0-9-]{2,120}$/),
    position: z.number().int().min(0).max(10000),
    remove: z.boolean().optional(),
  })
  .strict();

type Placement = {
  company_slug: string;
  question_id: string;
  position: number;
  source_url: string | null;
};

// PostgREST limits a single result page. Fetch every placement so directory
// counts and company sheets remain correct as the catalog grows past 1,000 rows.
async function readPlacements(
  client: ReturnType<typeof adminSupabase>,
  companySlug?: string,
): Promise<Placement[]> {
  const rows: Placement[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client
      .from("interview_sheet_questions")
      .select("company_slug,question_id,position,source_url")
      .order("company_slug")
      .order("position")
      .range(offset, offset + 999);
    if (companySlug) query = query.eq("company_slug", companySlug);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) break;
  }
  return rows;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST", "PATCH"].includes(req.method ?? ""))
    return res.status(405).json({ error: "Method not allowed." });
  if (
    req.method !== "GET" &&
    req.headers.origin &&
    req.headers.origin !== originFromRequest(req)
  )
    return res
      .status(403)
      .json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (req.method === "GET") {
      const params = new URL(req.url ?? "/", "http://localhost").searchParams;
      const slug = params.get("company");
      const mode = params.get("mode") ?? "directory";
      if (slug && !/^[a-z0-9-]{2,80}$/.test(slug))
        return res.status(400).json({ error: "Invalid company." });
      if (
        !new Set([
          "directory",
          "sheet",
          "state",
          "admin",
          "role",
          "category",
          "questions",
        ]).has(mode)
      )
        return res.status(400).json({ error: "Invalid view." });
      if (mode === "role")
        return res.status(200).json({
          admin: Boolean(user && (await client.rpc("is_platform_admin")).data),
        });
      if (mode === "admin") {
        if (!user || !(await client.rpc("is_platform_admin")).data)
          return res
            .status(403)
            .json({ error: "Administrator access required." });
        const admin = adminSupabase();
        const [companies, questions, placements, categoryPlacements] =
          await Promise.all([
            admin.from("interview_companies").select("*").order("position"),
            admin.from("interview_questions").select("*").order("title"),
            readPlacements(admin),
            admin
              .from("interview_category_questions")
              .select("*")
              .order("category_slug")
              .order("position"),
          ]);
        if (companies.error || questions.error || categoryPlacements.error)
          throw companies.error ?? questions.error ?? categoryPlacements.error;
        return res.status(200).json({
          companies: companies.data,
          questions: questions.data,
          placements,
          categoryPlacements: categoryPlacements.data,
        });
      }
      if (mode === "state") {
        if (!user) return res.status(200).json({ state: [] });
        const result = await client
          .from("interview_user_questions")
          .select("question_id,completed,bookmarked")
          .eq("user_id", user.id);
        if (result.error) throw result.error;
        return res.status(200).json({ state: result.data });
      }
      if (mode === "questions") {
        const result = await client
          .from("interview_questions")
          .select("id,title,source,url,difficulty,tags,popularity")
          .order("title");
        if (result.error) throw result.error;
        return res.status(200).json({ questions: result.data });
      }
      if (mode === "category") {
        const category = params.get("category");
        if (!category || !/^[a-z0-9-]{2,80}$/.test(category))
          return res.status(400).json({ error: "Choose a valid category." });
        const placements = await client
          .from("interview_category_questions")
          .select("question_id,position")
          .eq("category_slug", category)
          .order("position");
        if (placements.error) throw placements.error;
        const ids = (placements.data ?? []).map((entry) => entry.question_id);
        const questions = ids.length
          ? await client
              .from("interview_questions")
              .select("id,title,source,url,difficulty,tags,popularity")
              .in("id", ids)
          : { data: [], error: null };
        if (questions.error) throw questions.error;
        const byId = new Map(
          (questions.data ?? []).map((question) => [question.id, question]),
        );
        return res
          .status(200)
          .json({ questions: ids.map((id) => byId.get(id)).filter(Boolean) });
      }
      const companies = await client
        .from("interview_companies")
        .select("slug,name,description,position")
        .order("position");
      if (companies.error) throw companies.error;
      const placements = await readPlacements(
        client,
        mode === "sheet" ? (slug ?? undefined) : undefined,
      );
      if (mode === "directory") {
        const counts = new Map<string, number>();
        for (const placement of placements)
          counts.set(
            placement.company_slug,
            (counts.get(placement.company_slug) ?? 0) + 1,
          );
        return res.status(200).json({
          companies: (companies.data ?? []).map((company) => ({
            ...company,
            count: counts.get(company.slug) ?? 0,
          })),
        });
      }
      if (!slug) return res.status(400).json({ error: "Choose a company." });
      const company = companies.data?.find((entry) => entry.slug === slug);
      if (!company)
        return res.status(404).json({ error: "Company sheet not found." });
      const ids = placements
        .filter((entry) => entry.company_slug === slug)
        .map((entry) => entry.question_id);
      const questions = ids.length
        ? await client
            .from("interview_questions")
            .select("id,title,source,url,difficulty,tags,popularity")
            .in("id", ids)
        : { data: [], error: null };
      if (questions.error) throw questions.error;
      const byId = new Map(
        (questions.data ?? []).map((question) => [question.id, question]),
      );
      const ordered = placements
        .filter((entry) => entry.company_slug === slug)
        .map((entry) => {
          const question = byId.get(entry.question_id);
          return question && { ...question, url: entry.source_url ?? question.url };
        })
        .filter(Boolean);
      return res.status(200).json({ company, questions: ordered });
    }
    if (!user)
      return res
        .status(401)
        .json({ error: "Sign in to save your preparation." });
    if (req.method === "PATCH") {
      const parsed = stateSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ error: "Choose a valid question state." });
      const { data, error } = await client
        .from("interview_user_questions")
        .upsert(
          {
            user_id: user.id,
            question_id: parsed.data.questionId,
            completed: parsed.data.completed,
            bookmarked: parsed.data.bookmarked,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" },
        )
        .select("question_id,completed,bookmarked")
        .single();
      if (error) throw error;
      return res.status(200).json({ state: data });
    }
    if (!(await client.rpc("is_platform_admin")).data)
      return res.status(403).json({ error: "Administrator access required." });
    const payload = z
      .discriminatedUnion("kind", [
        companySchema,
        questionSchema,
        placementSchema,
        categoryPlacementSchema,
      ])
      .safeParse(req.body);
    if (!payload.success)
      return res
        .status(400)
        .json({ error: "Review the content fields and try again." });
    const admin = adminSupabase();
    const input = payload.data;
    if (input.kind === "company") {
      const { kind, ...company } = input;
      const result = await admin
        .from("interview_companies")
        .upsert(company)
        .select()
        .single();
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }
    if (input.kind === "question") {
      const { kind, ...question } = input;
      const result = await admin
        .from("interview_questions")
        .upsert(question)
        .select()
        .single();
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }
    if (input.kind === "categoryPlacement") {
      const result = input.remove
        ? await admin
            .from("interview_category_questions")
            .delete()
            .eq("category_slug", input.categorySlug)
            .eq("question_id", input.questionId)
        : await admin.from("interview_category_questions").upsert({
            category_slug: input.categorySlug,
            question_id: input.questionId,
            position: input.position,
          });
      if (result.error) throw result.error;
      return res.status(200).json({ ok: true });
    }
    const result = input.remove
      ? await admin
          .from("interview_sheet_questions")
          .delete()
          .eq("company_slug", input.companySlug)
          .eq("question_id", input.questionId)
      : await admin.from("interview_sheet_questions").upsert({
          company_slug: input.companySlug,
          question_id: input.questionId,
          position: input.position,
        });
    if (result.error) throw result.error;
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({
      error:
        "Interview preparations are temporarily unavailable. Please retry.",
    });
  } finally {
    flushCookies();
  }
}
