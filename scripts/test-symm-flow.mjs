import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

if (process.env.SYMM_E2E !== "1")
  throw new Error(
    "Set SYMM_E2E=1 to run this production-data integration check.",
  );
const base = process.env.ALGOGYM_TEST_URL ?? "http://localhost:8080";
const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey)
  throw new Error("Supabase server-side configuration is required.");
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const created = [];
const jar = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cookies(response, account) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const index = pair.indexOf("=");
    if (index > 0)
      jar.get(account).set(pair.slice(0, index), pair.slice(index + 1));
  }
}
async function call(account, method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      origin: base,
      cookie: [...jar.get(account)]
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  cookies(response, account);
  return {
    status: response.status,
    data: await response.json().catch(() => ({})),
  };
}
async function account() {
  const name = `symm-e2e-${randomUUID()}@example.com`;
  const password = `${randomBytes(20).toString("base64url")}A!1`;
  const added = await admin.auth.admin.createUser({
    email: name,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Symm integration check" },
  });
  if (added.error || !added.data.user)
    throw added.error ?? new Error("Test account was not created.");
  created.push(added.data.user.id);
  const id = added.data.user.id;
  jar.set(id, new Map());
  const login = await call(id, "POST", "/api/auth/email", {
    action: "login",
    email: name,
    password,
  });
  if (login.status !== 200 || !login.data.authenticated)
    throw new Error(`Test login failed: ${login.status}`);
  return id;
}

try {
  const first = await account();
  const second = await account();
  const started = Date.now();
  const createdPath = await call(first, "POST", "/api/symm", {
    action: "path.generate",
    requestId: randomUUID(),
    topic: "Teach me Dynamic Programming on Grids from first principles.",
    level: "beginner",
    goal: "competitive",
    hoursPerWeek: 5,
    language: "cpp",
  });
  if (createdPath.status !== 202 || !createdPath.data.pathId)
    throw new Error(
      `Path creation failed: ${createdPath.status} ${createdPath.data.error ?? ""}`,
    );
  const pathId = createdPath.data.pathId;
  const creationMs = Date.now() - started;
  let detail;
  for (let attempt = 0; attempt < 45; attempt++) {
    const result = await call(first, "GET", `/api/symm?path=${pathId}`);
    if (result.status !== 200)
      throw new Error(`Path load failed: ${result.status}`);
    detail = result.data;
    if (detail.path.status === "ready" || detail.path.status === "failed")
      break;
    await sleep(2000);
  }
  if (
    detail?.path.status !== "ready" ||
    !detail.modules.length ||
    !detail.lessons.length
  )
    throw new Error(`Roadmap did not become ready: ${detail?.path.status}`);
  const roadmapMs = Date.now() - started;
  const forbidden = await call(second, "GET", `/api/symm?path=${pathId}`);
  if (forbidden.status !== 404)
    throw new Error(`Cross-account read was not denied: ${forbidden.status}`);
  const selected =
    detail.lessons.find((lesson) =>
      /memo|tabulation|implementation|path count/i.test(lesson.title),
    ) ?? detail.lessons[0];
  if (selected.status !== "ready") {
    const generated = await call(first, "POST", "/api/symm", {
      action: "lesson.generate",
      lessonId: selected.id,
    });
    if (generated.status !== 200 && generated.status !== 409)
      throw new Error(
        `Lesson generation failed: ${generated.status} ${generated.data.error ?? ""}`,
      );
  }
  for (let attempt = 0; attempt < 32; attempt++) {
    const result = await call(
      first,
      "GET",
      `/api/symm?path=${pathId}&lesson=${selected.id}`,
    );
    detail = result.data;
    const lesson = detail.lessons.find((item) => item.id === selected.id);
    if (lesson.status === "ready") break;
    if (lesson.status === "failed")
      throw new Error("Lesson generation failed.");
    await sleep(2000);
  }
  const lesson = detail.lessons.find((item) => item.id === selected.id);
  if (lesson?.status !== "ready" || !lesson.content?.workedExample)
    throw new Error("Detailed lesson was not persisted.");
  const changed = await call(first, "POST", "/api/symm", {
    action: "path.language",
    pathId,
    language: "java",
  });
  if (changed.status !== 200)
    throw new Error(`Language update failed: ${changed.status}`);
  let variantStatus = "no-code-lesson";
  if (lesson.content.sections.some((section) => section.code)) {
    const variant = await call(first, "POST", "/api/symm", {
      action: "code.variant",
      lessonId: selected.id,
      language: "java",
    });
    if (variant.status !== 200 || variant.data.variant?.language !== "java")
      throw new Error(
        `Code variant failed: ${variant.status} ${variant.data.error ?? ""}`,
      );
    const cached = await call(first, "POST", "/api/symm", {
      action: "code.variant",
      lessonId: selected.id,
      language: "java",
    });
    if (
      cached.status !== 200 ||
      cached.data.variant?.code_content !== variant.data.variant.code_content
    )
      throw new Error("Code variant was not reused.");
    variantStatus = "cached";
  }
  const progress = await call(first, "POST", "/api/symm", {
    action: "progress.complete",
    lessonId: selected.id,
  });
  if (progress.status !== 200)
    throw new Error(`Progress update failed: ${progress.status}`);
  const persisted = await call(first, "GET", `/api/symm?path=${pathId}`);
  if (
    !persisted.data.progress.some((item) => item.lesson_id === selected.id) ||
    persisted.data.path.preferred_language !== "java"
  )
    throw new Error("Progress or language did not survive refresh.");
  const removed = await call(first, "POST", "/api/symm", {
    action: "path.delete",
    pathId,
  });
  if (removed.status !== 200)
    throw new Error(`Test path deletion failed: ${removed.status}`);
  const absent = await call(first, "GET", `/api/symm?path=${pathId}`);
  if (absent.status !== 404)
    throw new Error("Deleted path remained accessible.");
  console.log(
    JSON.stringify({
      passed: true,
      creationMs,
      roadmapMs,
      modules: detail.modules.length,
      lessons: detail.lessons.length,
      lessonSections: lesson.content.sections.length,
      variantStatus,
      ownershipDenied: true,
      progressPersisted: true,
      deletedPathDenied: true,
    }),
  );
} finally {
  for (const id of created) {
    const deleted = await admin.auth.admin.deleteUser(id);
    if (deleted.error)
      console.error("Temporary Symm test account cleanup failed", {
        id,
        code: deleted.error.code,
      });
  }
}
