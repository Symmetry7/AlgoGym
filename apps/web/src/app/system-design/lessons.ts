import "server-only";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { orderLessons, parseLesson, type Lesson } from "@/lib/lessons";

// Next runs from apps/web; the content folder sits at the repo root (AGENTS.md).
const DIR = join(process.cwd(), "..", "..", "content", "learn", "system-design");

let cache: Lesson[] | null = null;

/** Every published lesson in track order. Files starting with "_" are templates and never listed. */
export function getLessons(): Lesson[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!existsSync(DIR)) throw new Error(`System-design lessons folder not found: ${DIR}`);
  const files = readdirSync(DIR).filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));
  cache = orderLessons(files.map((f) => parseLesson(readFileSync(join(DIR, f), "utf8"), f.slice(0, -4))));
  return cache;
}

export function getLesson(slug: string) {
  const lessons = getLessons();
  const index = lessons.findIndex((l) => l.slug === slug);
  if (index < 0) return null;
  return { lesson: lessons[index], index, total: lessons.length, prev: lessons[index - 1] ?? null, next: lessons[index + 1] ?? null };
}
