import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { writeInterviewAnswer } from "./interview-answer";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("original interview answers", () => {
  it("writes a question-specific answer and example without sending reference text", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-2.5-flash-lite");
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates:[{content:{parts:[{text:JSON.stringify({
        answer:"A database is an organized collection of related data that applications can store, query, and update consistently.",
        example:"A university database can keep students, courses, and enrollments in related tables.",
      })}]}}],
    }),{status:200}));
    vi.stubGlobal("fetch", request);
    const answer=await writeInterviewAnswer({question:"What is a Database?",subject:"DBMS",category:"Fundamentals"});
    expect(answer).toContain("organized collection");
    expect(answer).toContain("Example: A university database");
    const body=JSON.parse(request.mock.calls[0][1].body);
    expect(body.contents[0].parts[0].text).toContain("What is a Database?");
    expect(body.contents[0].parts[0].text).not.toContain("hynts.in");
  });

  it("rejects empty or malformed answers", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{"answer":"Not sure","example":"x"}'}]}}]}),{status:200})));
    await expect(writeInterviewAnswer({question:"What is a Database?",subject:"DBMS",category:"Fundamentals"})).rejects.toThrow();
  });
});
