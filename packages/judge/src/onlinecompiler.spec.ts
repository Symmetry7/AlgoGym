import { describe, expect, it } from "vitest";
import { JudgeUnavailableError, createOnlineCompilerAdapter, digestMode, harness, judge } from "./index.mjs";

type Call = { url: string; body: Record<string, unknown>; headers: Record<string, string> };
function fakeFetch(respond: (body: Record<string, unknown>) => { status?: number; json?: unknown; headers?: Record<string, string> }) {
  const calls: Call[] = [];
  const fetch = async (url: string, init: { body: string; headers: Record<string, string> }) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body, headers: init.headers });
    const r = respond(body);
    return new Response(JSON.stringify(r.json ?? {}), { status: r.status ?? 200, headers: r.headers });
  };
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}

const sig = { function: "f", params: [{ name: "xs", type: "int[]" }], returns: "int" };
const limits = { time_ms_per_case: 1000, max_total_ms: 5000, memory_mb: 256 };
const run = (a: ReturnType<typeof createOnlineCompilerAdapter>, language = "cpp") => a.run({ language, source: "x", stdin: "", timeoutMs: 3000, memoryMb: 256 });

describe("OnlineCompiler.io adapter", () => {
  it("sends one run with the right compiler, limits and key, and feeds judge() (hidden case as a fingerprint)", async () => {
    const { fetch, calls } = fakeFetch((body) => {
      const nonce = String(body.code).match(/n: "([0-9a-f]{32})"/)?.[1];
      // Case 1 is public (full output), case 2 hidden (fingerprint of 0 = JSON "0").
      const lines = `noise\n{"n":"${nonce}","case":1,"ms":2,"output":3}\n{"n":"${nonce}","case":2,"ms":1,"digest":"af63ad4c86019caf"}\n`;
      return { json: { output: lines, error: "", status: "success", exit_code: 0, truncated: false } };
    });
    const adapter = createOnlineCompilerAdapter({ url: "https://runner.test/", key: "secret", fetch });
    const res = await judge({ adapter, language: "javascript", harness: harness(sig, "javascript"), code: "function f(xs){return xs.length}", cases: [{ args: [[1, 2, 3]], expected: 3 }, { args: [[]], expected: 0 }], limits, comparator: "exact", digestFrom: 1, digestMode: digestMode(sig, "exact") });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://runner.test/api/run-code-sync/");
    expect(calls[0].headers).toMatchObject({ Authorization: "secret" });
    expect(calls[0].body).toMatchObject({ compiler: "nodejs-24", input: "[[1,2,3]]\n[[]]\n", time_limit: 2, memory_limit: 256 }); // budget: 2 cases x 1 s
    expect(String(calls[0].body.code)).not.toContain("expected"); // expected outputs never leave the server
    expect(res.cases).toEqual([{ case: 1, verdict: "accepted", ms: 2, output: 3 }, { case: 2, verdict: "accepted", ms: 1 }]);
    expect(res.console).toBe("noise");
  });

  it("detects compile errors, timeouts, crashes and truncated output", async () => {
    const make = (json: unknown) => createOnlineCompilerAdapter({ key: "k", fetch: fakeFetch(() => ({ json })).fetch });
    expect(await run(make({ output: "", error: "code.cc:3:5: error: expected ';'", exit_code: 1 }))).toEqual({ compileError: "code.cc:3:5: error: expected ';'" });
    expect(await run(make({ output: "", error: "Main.java:12: error: cannot find symbol", exit_code: 1 }), "java")).toEqual({ compileError: "Main.java:12: error: cannot find symbol" });
    expect(await run(make({ output: "partial\n", error: "", exit_code: 124 }))).toMatchObject({ timedOut: true, exitCode: 0, stdout: "partial\n" });
    expect(await run(make({ output: "", error: "Segmentation fault", exit_code: 139 }))).toMatchObject({ timedOut: false, exitCode: 139 });
    expect(await run(make({ output: "", error: "Traceback ... SyntaxError", exit_code: 1 }), "python")).toMatchObject({ exitCode: 1, stderr: "Traceback ... SyntaxError" });
    expect(await run(make({ output: "x", error: "", exit_code: 0, truncated: true }))).toMatchObject({ truncated: true });
  });

  it("caps limits at the provider's maximums", async () => {
    const { fetch, calls } = fakeFetch(() => ({ json: { output: "", exit_code: 0 } }));
    await createOnlineCompilerAdapter({ key: "k", fetch }).run({ language: "java", source: "x", stdin: "", timeoutMs: 90_000, memoryMb: 4096 });
    expect(calls[0].body).toMatchObject({ compiler: "openjdk-25", time_limit: 30, memory_limit: 512 });
  });

  it("turns busy, quota and outage responses into JudgeUnavailableError (the caller keeps the user's code)", async () => {
    const busy = createOnlineCompilerAdapter({ key: "k", fetch: fakeFetch(() => ({ status: 429, headers: { "retry-after": "12" } })).fetch });
    await expect(run(busy)).rejects.toMatchObject({ name: "JudgeUnavailableError", retryAfter: 12 });
    const quota = createOnlineCompilerAdapter({ key: "k", fetch: fakeFetch(() => ({ status: 429 })).fetch });
    await expect(run(quota)).rejects.toThrow(/monthly limit/);
    const down = createOnlineCompilerAdapter({ key: "k", fetch: (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof globalThis.fetch });
    await expect(run(down)).rejects.toBeInstanceOf(JudgeUnavailableError);
    expect(() => createOnlineCompilerAdapter({ key: "" })).toThrow(/not configured/);
  });
});
