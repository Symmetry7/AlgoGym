import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  askTutor,
  generateCodeVariant,
  generateLesson,
  generateRoadmap,
} from "./symm-ai";

describe.skipIf(process.env.SYMM_LIVE_TEST !== "1")(
  "Symm AI live Gemini integration",
  () => {
    it("generates a roadmap, lesson and contextual tutor response", async () => {
      const path = await generateRoadmap(
        "Binary Search",
        "beginner",
        "competitive",
        5,
      );
      expect(path.category).toBe("competitive");
      expect(path.modules.length).toBeGreaterThanOrEqual(3);
      const first = path.modules[0];
      const lesson = await generateLesson(
        path.title,
        first.title,
        first.lessons[0],
        first.objectives,
      );
      expect(lesson.sections.length).toBeGreaterThanOrEqual(2);
      expect(lesson.commonMistakes?.length).toBeGreaterThan(0);
      const answer = await askTutor({
        path: path.title,
        module: first.title,
        lesson: first.lessons[0],
        question: "Why does binary search require a monotonic condition?",
        history: [],
      });
      expect(answer.reply.length).toBeGreaterThan(10);
      console.log(
        `Live Symm AI: ${path.modules.length} modules, ${lesson.sections.length} sections, tutor replied`,
      );
    }, 150_000);

    it("generates a general computer science roadmap without competitive classification", async () => {
      const path = await generateRoadmap(
        "Operating Systems",
        "beginner",
        "fundamentals",
        4,
      );
      expect(path.category).toBe("general");
      expect(path.modules.length).toBeGreaterThanOrEqual(3);
    }, 90_000);

    it("generates a full adjacency-list lesson", async () => {
      const lesson = await generateLesson(
        "Graph Algorithms",
        "Graph Representation",
        "Adjacency List Implementation",
        [
          "Represent a graph as an adjacency list",
          "Explain traversal and memory tradeoffs",
        ],
      );
      expect(lesson.sections.length).toBeGreaterThanOrEqual(2);
      expect(lesson.questions.length).toBeGreaterThan(0);
    }, 90_000);

    it("generates a validated Java code variant without regenerating a course", async () => {
      const variant = await generateCodeVariant({
        path: "Grid Dynamic Programming",
        module: "Tabulation",
        lesson: "Unique Paths",
        lessonContent:
          "Count right/down paths. Base dp[0][0]=1. Transition dp[i][j]=dp[i-1][j]+dp[i][j-1].",
        language: "java",
      });
      expect(variant.language).toBe("java");
      expect(variant.code).toMatch(/class|static|long\[\]/);
      expect(variant.explanation.length).toBeGreaterThan(60);
    }, 90_000);
  },
);
