import "server-only";
import { adminSupabase } from "./admin";
import { generateLesson, generateRoadmap } from "./symm-ai";
import type { ProgrammingLanguage } from "./symm-ai";

// The database job is durable; Next's after() starts it promptly and the cron
// worker can recover queued jobs after an interrupted deployment.
export async function processSymmPathJob(pathId: string, prefetch = true) {
  const admin = adminSupabase();
  const claimed = await admin
    .from("ai_generation_jobs")
    .update({
      status: "running",
      stage: "planning",
      started_at: new Date().toISOString(),
    })
    .eq("resource_type", "path")
    .eq("resource_id", pathId)
    .eq("status", "queued")
    .select("id,user_id,attempt_count")
    .maybeSingle();
  if (claimed.error) throw claimed.error;
  if (!claimed.data) return;
  const job = claimed.data;
  const started = Date.now();
  try {
    const fetched = await admin
      .from("ai_learning_paths")
      .select("id,topic,level,goal,hours_per_week,preferred_language,status")
      .eq("id", pathId)
      .eq("user_id", job.user_id)
      .single();
    if (fetched.error || !fetched.data || fetched.data.status !== "generating")
      throw new Error("The learning path is unavailable.");
    const path = fetched.data;
    const road = await generateRoadmap(
      path.topic,
      path.level,
      path.goal,
      path.hours_per_week,
      path.preferred_language as ProgrammingLanguage,
    );
    // Replacing an incomplete attempt is safe: paths are not usable until ready.
    const cleared = await admin
      .from("ai_learning_modules")
      .delete()
      .eq("path_id", pathId);
    if (cleared.error) throw cleared.error;
    const modules = await admin
      .from("ai_learning_modules")
      .insert(
        road.modules.map((module, position) => ({
          path_id: pathId,
          position,
          title: module.title,
          description: module.description,
          objectives: module.objectives,
          tags: module.tags,
          estimated_minutes: module.estimatedMinutes,
        })),
      )
      .select("id,position");
    if (modules.error || !modules.data)
      throw modules.error ?? new Error("Modules were not saved.");
    const lessons = await admin
      .from("ai_learning_lessons")
      .insert(
        modules.data.flatMap((saved) => {
          const module = road.modules[saved.position];
          return module.lessons.map((title, position) => ({
            module_id: saved.id,
            position,
            title,
            objectives: module.objectives,
          }));
        }),
      )
      .select("id,module_id,title,position,objectives");
    if (lessons.error) throw lessons.error;
    const updated = await admin
      .from("ai_learning_paths")
      .update({
        title: road.title,
        description: road.description,
        category: road.category,
        objectives: road.objectives,
        prerequisites: road.prerequisites,
        estimated_minutes: road.estimatedMinutes,
        status: "ready",
        prompt_version: 2,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pathId);
    if (updated.error) throw updated.error;
    await admin
      .from("ai_generation_jobs")
      .update({
        status: "completed",
        stage: "ready",
        finished_at: new Date().toISOString(),
        error_code: null,
      })
      .eq("id", job.id);
    console.info("symm_path_generated", {
      pathId,
      durationMs: Date.now() - started,
      modules: road.modules.length,
      lessons: road.modules.reduce((sum, item) => sum + item.lessons.length, 0),
    });
    // First-lesson prefetch is best effort. The roadmap is already available,
    // and an interrupted prefetch can still be regenerated from the lesson UI.
    const firstModule = modules.data.find((module) => module.position === 0);
    const firstLesson = lessons.data?.find(
      (lesson) => lesson.module_id === firstModule?.id && lesson.position === 0,
    );
    if (
      prefetch &&
      firstModule &&
      firstLesson &&
      Date.now() - started < 25000
    ) {
      try {
        await admin
          .from("ai_learning_lessons")
          .update({
            status: "generating",
            generation_started_at: new Date().toISOString(),
          })
          .eq("id", firstLesson.id);
        const content = await generateLesson(
          road.title,
          road.modules[0].title,
          firstLesson.title,
          firstLesson.objectives,
          path.preferred_language as ProgrammingLanguage,
        );
        await admin
          .from("ai_learning_lessons")
          .update({
            content,
            status: "ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", firstLesson.id);
        console.info("symm_first_lesson_prefetched", {
          pathId,
          durationMs: Date.now() - started,
        });
      } catch (prefetchError) {
        console.warn("symm_first_lesson_prefetch_failed", {
          pathId,
          prefetchError,
        });
        await admin
          .from("ai_learning_lessons")
          .update({ status: "failed" })
          .eq("id", firstLesson.id);
      }
    }
  } catch (error) {
    console.error("symm_path_generation_failed", {
      pathId,
      durationMs: Date.now() - started,
      error,
    });
    await admin
      .from("ai_learning_paths")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", pathId);
    await admin
      .from("ai_generation_jobs")
      .update({
        status: "failed",
        stage: "failed",
        attempt_count: job.attempt_count + 1,
        error_code: "generation_failed",
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);
  }
}

export async function recoverSymmPathJobs() {
  const admin = adminSupabase();
  const stale = new Date(Date.now() - 2 * 60_000).toISOString();
  const pending = await admin
    .from("ai_generation_jobs")
    .select("id,resource_id,status,attempt_count")
    .eq("resource_type", "path")
    .lt("attempt_count", 3)
    .or(`status.eq.queued,and(status.eq.running,started_at.lt.${stale})`)
    .order("queued_at")
    .limit(1);
  if (pending.error) throw pending.error;
  for (const job of pending.data ?? []) {
    if (job.status === "running")
      await admin
        .from("ai_generation_jobs")
        .update({ status: "queued", attempt_count: job.attempt_count + 1 })
        .eq("id", job.id)
        .eq("status", "running");
    await processSymmPathJob(job.resource_id, false);
  }
  return { symmJobs: pending.data?.length ?? 0 };
}
