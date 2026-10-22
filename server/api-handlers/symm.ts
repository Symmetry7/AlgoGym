import { z } from "zod";
import { after } from "next/server";
import { adminSupabase } from "../admin";
import {
  serverSupabase,
  originFromRequest,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";
import {
  AiFailure,
  AiUnavailable,
  generateLesson,
  generateCodeVariant,
  askTutor,
  isAiConfigured,
  type ProgrammingLanguage,
} from "../symm-ai";
import { processSymmPathJob } from "../symm-jobs";
import { recommendProblems } from "../symm-recommend";
import { allowAuthAttempt } from "../auth-policy";
import { creditsEnabled, readAiCredits, queueCreditPath } from "../ai-credits";

const uuid = z.string().uuid();
const action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("path.generate"),
    requestId: uuid,
    topic: z.string().trim().min(3).max(180),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    goal: z.enum(["fundamentals", "interview", "competitive", "mastery"]),
    hoursPerWeek: z.number().int().min(1).max(40),
    language: z.enum(["cpp", "java", "python"]).default("cpp"),
  }),
  z.object({ action: z.literal("path.retry"), pathId: uuid }),
  z.object({
    action: z.literal("path.language"),
    pathId: uuid,
    language: z.enum(["cpp", "java", "python"]),
  }),
  z.object({
    action: z.literal("code.variant"),
    lessonId: uuid,
    language: z.enum(["cpp", "java", "python"]),
  }),
  z.object({ action: z.literal("lesson.generate"), lessonId: uuid }),
  z.object({ action: z.literal("progress.complete"), lessonId: uuid }),
  z.object({
    action: z.literal("lesson.report"),
    lessonId: uuid,
    reason: z.string().trim().min(10).max(500),
  }),
  z.object({
    action: z.literal("tutor.ask"),
    lessonId: uuid,
    message: z.string().trim().min(2).max(2000),
  }),
  z.object({ action: z.literal("module.claim"), moduleId: uuid }),
  z.object({ action: z.literal("module.recommend"), moduleId: uuid }),
  z.object({ action: z.literal("path.delete"), pathId: uuid }),
]);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });
  if (
    req.method === "POST" &&
    req.headers.origin &&
    req.headers.origin !== originFromRequest(req)
  )
    return res
      .status(403)
      .json({ error: "This request could not be verified." });
  if (
    req.method === "GET" &&
    new URL(req.url ?? "http://localhost").searchParams.get("health") === "1"
  )
    return res.status(200).json({ configured: isAiConfigured() });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user)
      return res.status(401).json({ error: "Sign in to use Symm AI." });
    const admin = adminSupabase();
    if (req.method === "GET") {
      const pathId = new URL(req.url ?? "http://localhost").searchParams.get(
        "path",
      );
      if (!pathId) {
        const { data, error } = await client
          .from("ai_learning_paths")
          .select(
            "id,topic,title,description,level,goal,category,status,preferred_language,created_at,updated_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const pathIds = (data ?? []).map((path) => path.id);
        const summary = new Map<
          string,
          { moduleCount: number; lessonCount: number; completedCount: number }
        >();
        if (pathIds.length) {
          const { data: modules, error: moduleError } = await client
            .from("ai_learning_modules")
            .select("id,path_id")
            .in("path_id", pathIds);
          if (moduleError) throw moduleError;
          const moduleToPath = new Map(
            (modules ?? []).map((module) => [module.id, module.path_id]),
          );
          for (const module of modules ?? []) {
            const current = summary.get(module.path_id) ?? {
              moduleCount: 0,
              lessonCount: 0,
              completedCount: 0,
            };
            current.moduleCount++;
            summary.set(module.path_id, current);
          }
          const lessons: { id: string; module_id: string }[] = [];
          const moduleIds = [...moduleToPath.keys()];
          for (let offset = 0; offset < moduleIds.length; offset += 80) {
            const batch = await client
              .from("ai_learning_lessons")
              .select("id,module_id")
              .in("module_id", moduleIds.slice(offset, offset + 80));
            if (batch.error) throw batch.error;
            lessons.push(...(batch.data ?? []));
          }
          const lessonToPath = new Map<string, string>();
          for (const lesson of lessons) {
            const parent = moduleToPath.get(lesson.module_id);
            if (!parent) continue;
            lessonToPath.set(lesson.id, parent);
            summary.get(parent)!.lessonCount++;
          }
          const lessonIds = [...lessonToPath.keys()];
          for (let offset = 0; offset < lessonIds.length; offset += 80) {
            const batch = await client
              .from("ai_learning_progress")
              .select("lesson_id")
              .eq("user_id", user.id)
              .in("lesson_id", lessonIds.slice(offset, offset + 80));
            if (batch.error) throw batch.error;
            for (const progress of batch.data ?? []) {
              const parent = lessonToPath.get(progress.lesson_id);
              if (parent) summary.get(parent)!.completedCount++;
            }
          }
        }
        return res.status(200).json({
          paths: (data ?? []).map((path) => ({
            ...path,
            ...(summary.get(path.id) ?? {
              moduleCount: 0,
              lessonCount: 0,
              completedCount: 0,
            }),
          })),
          configured: isAiConfigured(),
          credits: await readAiCredits(admin,user.id),
        });
      }
      if (!uuid.safeParse(pathId).success)
        return res.status(400).json({ error: "Invalid learning path." });
      const { data: path, error } = await client
        .from("ai_learning_paths")
        .select("*")
        .eq("id", pathId)
        .eq("user_id", user.id)
        .single();
      if (error || !path)
        return res.status(404).json({ error: "Learning path not found." });
      const { data: modules, error: modulesError } = await client
        .from("ai_learning_modules")
        .select("*")
        .eq("path_id", pathId)
        .order("position");
      if (modulesError) throw modulesError;
      const moduleIds = (modules ?? []).map((m) => m.id);
      const { data: lessons, error: lessonsError } = moduleIds.length
        ? await client
            .from("ai_learning_lessons")
            .select("*")
            .in("module_id", moduleIds)
            .order("position")
        : { data: [], error: null };
      if (lessonsError) throw lessonsError;
      const lessonIds = (lessons ?? []).map((l) => l.id);
      const { data: progress, error: progressError } = lessonIds.length
        ? await client
            .from("ai_learning_progress")
            .select("lesson_id,completed_at")
            .eq("user_id", user.id)
            .in("lesson_id", lessonIds)
        : { data: [], error: null };
      if (progressError) throw progressError;
      const { data: recommendations, error: recommendationsError } =
        moduleIds.length
          ? await client
              .from("ai_recommended_problems")
              .select(
                "module_id,position,problems(id,provider,title,url,cf_rating,lc_difficulty,tags)",
              )
              .in("module_id", moduleIds)
              .order("position")
          : { data: [], error: null };
      if (recommendationsError) throw recommendationsError;
      const { data: moduleAwards, error: awardsError } = moduleIds.length
        ? await client
            .from("ai_module_awards")
            .select("module_id,points,awarded_at")
            .eq("user_id", user.id)
            .in("module_id", moduleIds)
        : { data: [], error: null };
      if (awardsError) throw awardsError;
      const { data: codeVariants, error: variantsError } = lessonIds.length
        ? await client
            .from("ai_lesson_code_variants")
            .select(
              "lesson_id,language,code_content,explanation,generation_version",
            )
            .in("lesson_id", lessonIds)
        : { data: [], error: null };
      if (variantsError) throw variantsError;
      const selectedLesson = new URL(
        req.url ?? "http://localhost",
      ).searchParams.get("lesson");
      let conversation: unknown[] = [];
      if (selectedLesson && lessonIds.includes(selectedLesson)) {
        const messages = await client
          .from("ai_learning_conversations")
          .select("id,role,message,created_at")
          .eq("user_id", user.id)
          .eq("lesson_id", selectedLesson)
          .order("created_at")
          .order("role", { ascending: false })
          .limit(30);
        if (messages.error) throw messages.error;
        conversation = messages.data ?? [];
      }
      return res.status(200).json({
        path,
        modules,
        lessons,
        progress,
        recommendations,
        moduleAwards,
        codeVariants,
        conversation,
        configured: isAiConfigured(),
        credits: await readAiCredits(admin,user.id),
      });
    }
    const parsed = action.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Invalid request." });
    const value = parsed.data;
    if (value.action === "path.language") {
      const saved = await admin
        .from("ai_learning_paths")
        .update({
          preferred_language: value.language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", value.pathId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data)
        return res.status(404).json({ error: "Learning path not found." });
      return res.status(200).json({ language: value.language });
    }
    if (value.action === "path.retry") {
      if(creditsEnabled()) {
        const result=await queueCreditPath(admin,user.id,value);
        after(()=>processSymmPathJob(result.pathId));
        return res.status(202).json(result);
      }
      const path = await admin
        .from("ai_learning_paths")
        .select("id,status")
        .eq("id", value.pathId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (path.error) throw path.error;
      if (!path.data)
        return res.status(404).json({ error: "Learning path not found." });
      if (path.data.status !== "failed")
        return res
          .status(409)
          .json({ error: "This path is already being prepared." });
      const job = await admin
        .from("ai_generation_jobs")
        .update({
          status: "queued",
          stage: "queued",
          error_code: null,
          queued_at: new Date().toISOString(),
        })
        .eq("resource_type", "path")
        .eq("resource_id", value.pathId)
        .eq("user_id", user.id)
        .eq("status", "failed")
        .lt("attempt_count", 3)
        .select("id")
        .maybeSingle();
      if (job.error) throw job.error;
      if (!job.data)
        return res.status(429).json({
          error: "This path reached its retry limit. Create a new path.",
        });
      const resumed = await admin
        .from("ai_learning_paths")
        .update({ status: "generating" })
        .eq("id", value.pathId);
      if (resumed.error) throw resumed.error;
      after(() => processSymmPathJob(value.pathId));
      return res
        .status(202)
        .json({ pathId: value.pathId, status: "generating" });
    }
    if (value.action === "path.delete") {
      const removed = await admin
        .from("ai_learning_paths")
        .delete()
        .eq("id", value.pathId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();
      if (removed.error) throw removed.error;
      if (!removed.data)
        return res.status(404).json({ error: "Learning path not found." });
      return res.status(200).json({ deleted: true });
    }
    if (value.action === "module.claim") {
      const { data, error } = await client.rpc("claim_symm_module_award", {
        p_module: value.moduleId,
      });
      if (error) {
        const known = [
          "Module not found",
          "Complete every lesson first",
          "A new eligible verified practice solve is required",
          "Practice rewards apply only to competitive modules",
        ];
        return res
          .status(error.message === "Module not found" ? 404 : 409)
          .json({
            error: known.includes(error.message)
              ? error.message
              : "Module reward could not be claimed. Please retry.",
          });
      }
      return res.status(200).json({ points: data });
    }
    if (value.action === "module.recommend") {
      if (!allowAuthAttempt(`symm-recommend:${user.id}`, 5, 60_000))
        return res
          .status(429)
          .json({ error: "Wait a minute before retrying recommendations." });
      const { data: moduleRow, error } = await admin
        .from("ai_learning_modules")
        .select("id,title,tags,ai_learning_paths(user_id,topic,level,category)")
        .eq("id", value.moduleId)
        .single();
      if (error || !moduleRow)
        return res.status(404).json({ error: "Module not found." });
      const path = moduleRow.ai_learning_paths as unknown as {
        user_id: string;
        topic: string;
        level: string;
        category: string;
      };
      if (path.user_id !== user.id || path.category !== "competitive")
        return res.status(404).json({ error: "Module not found." });
      try {
        const problems = await recommendProblems(
          admin,
          moduleRow.id,
          moduleRow.tags,
          path.level,
          moduleRow.title,
          path.topic,
        );
        return res.status(200).json({ count: problems.length });
      } catch {
        return res.status(502).json({
          error: "The provider catalog is unavailable. Please retry shortly.",
        });
      }
    }
    if (value.action === "path.generate") {
      if(creditsEnabled()) {
        if(!isAiConfigured())throw new AiUnavailable('Symm AI is temporarily unavailable.');
        if(!allowAuthAttempt(`symm-credit-path:${user.id}`,8,60_000))return res.status(429).json({error:'Please wait before creating another path.'});
        const result=await queueCreditPath(admin,user.id,value);
        after(()=>processSymmPathJob(result.pathId));
        return res.status(202).json(result);
      }
      const prior = await client
        .from("ai_learning_paths")
        .select("id,status")
        .eq("user_id", user.id)
        .eq("request_id", value.requestId)
        .maybeSingle();
      if (prior.error) throw prior.error;
      if (prior.data)
        return res
          .status(200)
          .json({ pathId: prior.data.id, status: prior.data.status });
      if (!isAiConfigured())
        throw new AiUnavailable(
          "Symm AI needs a server-side Gemini API key before paths can be generated.",
        );
      const quota = await client.rpc("reserve_symm_generation", {
        p_kind: "path",
      });
      if (quota.error) throw quota.error;
      if (!quota.data)
        return res
          .status(429)
          .json({ error: "Daily roadmap limit reached. Try again tomorrow." });
      const inserted = await admin
        .from("ai_learning_paths")
        .insert({
          user_id: user.id,
          request_id: value.requestId,
          topic: value.topic,
          title: value.topic,
          level: value.level,
          goal: value.goal,
          hours_per_week: value.hoursPerWeek,
          preferred_language: value.language,
        })
        .select("id")
        .single();
      if (inserted.error) {
        if (inserted.error.code === "23505")
          return res.status(409).json({
            error: "This request is already generating. Refresh your paths.",
          });
        throw inserted.error;
      }
      const pathId = inserted.data.id;
      const job = await admin.from("ai_generation_jobs").insert({
        user_id: user.id,
        resource_type: "path",
        resource_id: pathId,
        idempotency_key: value.requestId,
      });
      if (job.error) {
        await admin
          .from("ai_learning_paths")
          .update({ status: "failed" })
          .eq("id", pathId);
        throw job.error;
      }
      after(() => processSymmPathJob(pathId));
      return res.status(202).json({ pathId, status: "generating" });
    }
    const lesson = await admin
      .from("ai_learning_lessons")
      .select(
        "id,title,objectives,content,status,module_id,ai_learning_modules(id,title,path_id,ai_learning_paths(id,user_id,title,level,category,preferred_language))",
      )
      .eq("id", value.lessonId)
      .single();
    if (lesson.error || !lesson.data)
      return res.status(404).json({ error: "Lesson not found." });
    const moduleRow = lesson.data.ai_learning_modules as unknown as {
      id: string;
      title: string;
      path_id: string;
      ai_learning_paths: {
        id: string;
        user_id: string;
        title: string;
        level: string;
        category: string;
        preferred_language: ProgrammingLanguage;
      };
    };
    if (moduleRow.ai_learning_paths.user_id !== user.id)
      return res.status(404).json({ error: "Lesson not found." });
    if (value.action === "lesson.report") {
      if (lesson.data.status !== "ready")
        return res
          .status(409)
          .json({ error: "Only generated lessons can be reported." });
      const saved = await admin.from("ai_content_reports").upsert(
        {
          user_id: user.id,
          lesson_id: value.lessonId,
          reason: value.reason,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
      if (saved.error) throw saved.error;
      return res.status(200).json({ reported: true });
    }
    if (value.action === "progress.complete") {
      if (lesson.data.status !== "ready")
        return res
          .status(409)
          .json({ error: "Open the lesson before marking it complete." });
      const saved = await admin
        .from("ai_learning_progress")
        .upsert(
          { user_id: user.id, lesson_id: value.lessonId },
          { onConflict: "user_id,lesson_id" },
        );
      if (saved.error) throw saved.error;
      return res.status(200).json({ completed: true });
    }
    if (value.action === "code.variant") {
      if (lesson.data.status !== "ready")
        return res.status(409).json({ error: "Open the lesson first." });
      const existing = await client
        .from("ai_lesson_code_variants")
        .select(
          "lesson_id,language,code_content,explanation,generation_version",
        )
        .eq("lesson_id", value.lessonId)
        .eq("language", value.language)
        .eq("generation_version", 1)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data)
        return res.status(200).json({ variant: existing.data });
      if (!isAiConfigured())
        throw new AiUnavailable("Symm AI is temporarily unavailable.");
      const content = lesson.data.content as {
        sections?: { code?: string }[];
      } | null;
      if (!content?.sections?.some((section) => section.code))
        return res.status(200).json({ variant: null });
      if (!allowAuthAttempt(`symm-code:${user.id}`, 8, 60_000))
        return res.status(429).json({
          error: "Please wait before generating another code variant.",
        });
      const generated = await generateCodeVariant({
        path: moduleRow.ai_learning_paths.title,
        module: moduleRow.title,
        lesson: lesson.data.title,
        language: value.language,
        lessonContent: JSON.stringify(lesson.data.content).slice(0, 12000),
      });
      if (generated.language !== value.language)
        throw new AiFailure(
          "The code variant could not be validated. Please retry.",
        );
      const saved = await admin
        .from("ai_lesson_code_variants")
        .upsert(
          {
            lesson_id: value.lessonId,
            language: value.language,
            code_content: generated.code,
            explanation: generated.explanation,
            generation_version: 1,
          },
          { onConflict: "lesson_id,language,generation_version" },
        )
        .select(
          "lesson_id,language,code_content,explanation,generation_version",
        )
        .single();
      if (saved.error) throw saved.error;
      return res.status(200).json({ variant: saved.data });
    }
    if (value.action === "lesson.generate") {
      if (lesson.data.status === "ready")
        return res.status(200).json({ lesson: lesson.data });
      if (!isAiConfigured())
        throw new AiUnavailable(
          "Symm AI needs a server-side Gemini API key before lessons can be generated.",
        );
      const quota = await client.rpc("reserve_symm_generation", {
        p_kind: "lesson",
      });
      if (quota.error) throw quota.error;
      if (!quota.data)
        return res
          .status(429)
          .json({ error: "Daily lesson limit reached. Try again tomorrow." });
      const stale = new Date(Date.now() - 2 * 60_000).toISOString();
      const claimable =
        lesson.data.status === "generating"
          ? admin
              .from("ai_learning_lessons")
              .update({
                status: "generating",
                generation_started_at: new Date().toISOString(),
              })
              .eq("id", value.lessonId)
              .eq("status", "generating")
              .lt("generation_started_at", stale)
          : admin
              .from("ai_learning_lessons")
              .update({
                status: "generating",
                generation_started_at: new Date().toISOString(),
              })
              .eq("id", value.lessonId)
              .in("status", ["pending", "failed"]);
      const claimed = await claimable.select("id").maybeSingle();
      if (claimed.error) throw claimed.error;
      if (!claimed.data)
        return res.status(409).json({
          error: "This lesson is already generating. Refresh shortly.",
        });
      try {
        const content = await generateLesson(
          moduleRow.ai_learning_paths.title,
          moduleRow.title,
          lesson.data.title,
          lesson.data.objectives,
          moduleRow.ai_learning_paths.preferred_language,
        );
        const saved = await admin
          .from("ai_learning_lessons")
          .update({
            content,
            status: "ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", value.lessonId)
          .select("*")
          .single();
        if (saved.error) throw saved.error;
        return res.status(200).json({ lesson: saved.data });
      } catch (error) {
        await admin
          .from("ai_learning_lessons")
          .update({ status: "failed" })
          .eq("id", value.lessonId);
        throw error;
      }
    }
    if (lesson.data.status !== "ready")
      return res
        .status(409)
        .json({ error: "Open the lesson before asking your tutor." });
    if (!isAiConfigured())
      throw new AiUnavailable(
        "Symm AI needs a server-side Gemini API key before tutoring is available.",
      );
    const quota = await client.rpc("reserve_symm_generation", {
      p_kind: "tutor",
    });
    if (quota.error) throw quota.error;
    if (!quota.data)
      return res
        .status(429)
        .json({ error: "Daily tutoring limit reached. Try again tomorrow." });
    const history = await client
      .from("ai_learning_conversations")
      .select("role,message")
      .eq("user_id", user.id)
      .eq("lesson_id", value.lessonId)
      .order("created_at", { ascending: false })
      .order("role", { ascending: true })
      .limit(10);
    if (history.error) throw history.error;
    const answer = await askTutor({
      path: moduleRow.ai_learning_paths.title,
      module: moduleRow.title,
      lesson: lesson.data.title,
      level: moduleRow.ai_learning_paths.level,
      language: moduleRow.ai_learning_paths.preferred_language,
      lessonSummary: (() => {
        const content = lesson.data.content as {
          introduction?: string;
          workedExample?: { problem?: string; walkthrough?: string };
          sections?: { heading?: string; explanation?: string }[];
          takeaways?: string[];
        } | null;
        return JSON.stringify({
          introduction: content?.introduction?.slice(0, 900),
          workedExample: content?.workedExample?.problem,
          sections: content?.sections?.map((section) => ({
            heading: section.heading,
            summary: section.explanation?.slice(0, 250),
          })),
          takeaways: content?.takeaways,
        }).slice(0, 6000);
      })(),
      question: value.message,
      history: (history.data ?? []).reverse(),
    });
    const messageTime = Date.now();
    const saved = await admin
      .from("ai_learning_conversations")
      .insert([
        {
          user_id: user.id,
          lesson_id: value.lessonId,
          role: "user",
          message: value.message,
          created_at: new Date(messageTime).toISOString(),
        },
        {
          user_id: user.id,
          lesson_id: value.lessonId,
          role: "assistant",
          message: [answer.reply, answer.question].filter(Boolean).join("\n\n"),
          created_at: new Date(messageTime + 1).toISOString(),
        },
      ])
      .select("id,role,message,created_at");
    if (saved.error) throw saved.error;
    return res.status(200).json({ messages: saved.data });
  } catch (error) {
    if(error && typeof error==='object' && 'message' in error && String(error.message).includes('Insufficient AI credits'))return res.status(402).json({error:'No AI credits remaining. Explore plans to continue.',code:'credits_exhausted'});
    const status =
      error instanceof AiUnavailable
        ? 503
        : error instanceof AiFailure
          ? 502
          : 503;
    if (!(error instanceof AiUnavailable) && !(error instanceof AiFailure))
      console.error("Symm AI request failed", error);
    return res.status(status).json({
      error:
        error instanceof AiUnavailable || error instanceof AiFailure
          ? error.message
          : "Symm AI could not complete the request. Please retry.",
    });
  } finally {
    flushCookies();
  }
}
