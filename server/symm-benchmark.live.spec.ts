import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  generateLesson,
  generateRoadmap,
  type ProgrammingLanguage,
} from "./symm-ai";

const words = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;
describe.skipIf(process.env.SYMM_BENCHMARK !== "1")(
  "Symm AI live content benchmark",
  () => {
    it("plans Grid DP and teaches Unique Paths in all supported languages", async () => {
      const roadmapStart = Date.now();
      const road = await generateRoadmap(
        "Teach me Dynamic Programming on Grids from beginner to advanced, with complete examples, code, complexity analysis and practice problems.",
        "beginner",
        "competitive",
        5,
        "cpp",
      );
      const roadmapMs = Date.now() - roadmapStart;
      expect(road.category).toBe("competitive");
      expect(road.modules.length).toBeGreaterThanOrEqual(5);
      const lessonMetrics = [];
      const languages = (
        ["cpp", "java", "python"] as ProgrammingLanguage[]
      ).filter(
        (language) =>
          !process.env.SYMM_BENCHMARK_LANG ||
          process.env.SYMM_BENCHMARK_LANG === language,
      );
      for (const language of languages) {
        const start = Date.now();
        const lesson = await generateLesson(
          road.title,
          "Classic Grid DP Problems",
          "Unique Paths in a Grid",
          [
            "Derive the path-count recurrence",
            "Compare memoization, tabulation and space optimization",
          ],
          language,
        );
        const wordCount = words(
          [
            lesson.introduction,
            lesson.workedExample.walkthrough,
            ...lesson.sections.flatMap((section) => [
              section.explanation,
              section.example ?? "",
            ]),
          ].join(" "),
        );
        const codeLanguages = lesson.sections
          .filter((section) => section.code)
          .map((section) => section.language);
        expect(lesson.workedExample.walkthrough.length).toBeGreaterThanOrEqual(
          180,
        );
        expect(lesson.sections.length).toBeGreaterThanOrEqual(5);
        expect(codeLanguages.every((value) => value === language)).toBe(true);
        expect(wordCount).toBeGreaterThan(500);
        lessonMetrics.push({
          language,
          ms: Date.now() - start,
          words: wordCount,
          sections: lesson.sections.length,
          codeBlocks: codeLanguages.length,
        });
      }
      console.info(
        "SYMM_BENCHMARK",
        JSON.stringify({
          roadmapMs,
          modules: road.modules.length,
          lessons: road.modules.reduce(
            (sum, module) => sum + module.lessons.length,
            0,
          ),
          lessonMetrics,
        }),
      );
    }, 240_000);
    it.skipIf(process.env.SYMM_BENCHMARK_LANG)(
      "covers Dijkstra, binary-search reasoning, and operating systems without forced code",
      async () => {
        const checks = [];
        for (const [topic, lessonTitle, goal, expected] of [
          [
            "Teach me Dijkstra's algorithm from beginner to advanced.",
            "Why Dijkstra Requires Nonnegative Edges",
            "competitive",
            /non.?negative/i,
          ],
          [
            "Teach me Binary Search and Binary Search on Answer.",
            "Binary Search on a Monotonic Answer Space",
            "competitive",
            /monoton/i,
          ],
          [
            "Teach me Operating Systems from scratch.",
            "Processes and Threads",
            "fundamentals",
            /process/i,
          ],
        ] as const) {
          const start = Date.now();
          const road = await generateRoadmap(
            topic,
            "beginner",
            goal,
            5,
            "java",
          );
          const lesson = await generateLesson(
            road.title,
            road.modules[0].title,
            lessonTitle,
            ["Explain the concept from first principles"],
            "java",
          );
          const prose = [
            lesson.introduction,
            lesson.workedExample.walkthrough,
            ...lesson.sections.map((section) => section.explanation),
          ].join(" ");
          expect(prose).toMatch(expected);
          expect(road.category).toBe(
            goal === "competitive" ? "competitive" : "general",
          );
          // A short illustrative snippet may be useful in OS theory; exercises
          // should not dominate conceptual lessons.
          if (goal === "fundamentals")
            expect(
              lesson.sections.filter((section) => section.code).length,
            ).toBeLessThanOrEqual(1);
          checks.push({
            topic,
            ms: Date.now() - start,
            modules: road.modules.length,
            words: words(prose),
            codeBlocks: lesson.sections.filter((section) => section.code)
              .length,
          });
        }
        console.info("SYMM_TOPIC_BENCHMARK", JSON.stringify(checks));
      },
      240_000,
    );
  },
);
