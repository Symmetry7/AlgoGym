import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  AiUnavailable,
  generateRoadmap,
  lessonSchema,
  roadmapSchema,
} from "./symm-ai";
import { validTags, inferredTags } from "./symm-recommend";

describe("Symm AI validation", () => {
  it("rejects incomplete roadmaps before persistence", () => {
    expect(
      roadmapSchema.safeParse({ title: "Graphs", modules: [] }).success,
    ).toBe(false);
  });
  it("requires a worked example and substantive first-principles sections", () => {
    const lesson = {
      introduction: "A".repeat(220),
      workedExample: {
        problem: "Count paths in a two by two grid.",
        walkthrough:
          "Trace the paths into each cell from its upper and left neighbors. ".repeat(
            4,
          ),
      },
      sections: [
        { heading: "Motivation", explanation: "M".repeat(300) },
        { heading: "Naive approach", explanation: "N".repeat(300) },
        {
          heading: "Derivation",
          explanation: "D".repeat(300),
          example: "For a 2 by 2 grid, count both predecessor cells.",
        },
        {
          heading: "Implementation",
          explanation: "I".repeat(300),
          code: "int answer = 1;",
          language: "cpp",
        },
        { heading: "Complexity and edge cases", explanation: "C".repeat(300) },
      ],
      questions: [
        "Why does a state depend on its neighbors?",
        "Which base case is needed?",
      ],
      takeaways: ["Define a state", "Prove its transition"],
      commonMistakes: ["Missing the base case", "Wrong update order"],
    };
    expect(lessonSchema.safeParse(lesson).success).toBe(true);
    expect(
      lessonSchema.safeParse({ ...lesson, workedExample: undefined }).success,
    ).toBe(false);
  });
  it("only recommends official Codeforces tags", () => {
    expect(validTags(["DP", "graphs", "made up topic", "dp"])).toEqual([
      "dp",
      "graphs",
    ]);
    expect(inferredTags("Graph Algorithms: shortest paths")).toEqual([
      "graphs",
      "shortest paths",
    ]);
  });
  it("fails clearly when no server Gemini key is configured", async () => {
    const prior = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await expect(
        generateRoadmap("Graph Algorithms", "beginner", "competitive", 5),
      ).rejects.toBeInstanceOf(AiUnavailable);
    } finally {
      if (prior === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prior;
    }
  });
});
