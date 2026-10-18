import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { AiUnavailable, generateRoadmap, lessonSchema, roadmapSchema } from "./symm-ai";
import { validTags, inferredTags } from "./symm-recommend";

describe("Symm AI validation", () => {
  it("rejects incomplete roadmaps before persistence", () => {
    expect(
      roadmapSchema.safeParse({ title: "Graphs", modules: [] }).success,
    ).toBe(false);
  });
  it("accepts a bounded, structured lesson", () => {
    expect(
      lessonSchema.safeParse({
        introduction: "A topic worth explaining carefully.",
        sections: [
          { heading: "First", explanation: "A".repeat(60) },
          { heading: "Second", explanation: "B".repeat(60) },
        ],
        questions: ["What assumption makes this work?"],
        takeaways: ["First key idea", "Second key idea"],
      }).success,
    ).toBe(true);
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
      await expect(generateRoadmap("Graph Algorithms", "beginner", "competitive", 5)).rejects.toBeInstanceOf(AiUnavailable);
    } finally {
      if (prior === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prior;
    }
  });
});
