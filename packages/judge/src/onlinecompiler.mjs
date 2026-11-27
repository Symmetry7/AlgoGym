// OnlineCompiler.io adapter (M11): one synchronous run per Run/Submit, same interface as the local adapter, so judge()
// and the generated harnesses work unchanged (SYSTEM_ARCHITECTURE.md §4.2). API: POST /api/run-code-sync/ with
// { compiler, code, input, time_limit (s), memory_limit (MB) } -> { output, error, exit_code, truncated, ... }.

export const RUNNER_COMPILERS = {
  javascript: { id: "nodejs-24", name: "JavaScript", version: "Node 24" },
  python: { id: "python-3.14", name: "Python", version: "3.14" },
  cpp: { id: "g++-15", name: "C++", version: "17 (GCC 15)" }, // g++ default dialect is GNU C++17
  java: { id: "openjdk-25", name: "Java", version: "25" }, // single-file mode: runs the first class with main (Main)
};

export class JudgeUnavailableError extends Error {
  constructor(message, { retryAfter } = {}) {
    super(message);
    this.name = "JudgeUnavailableError";
    this.retryAfter = retryAfter;
  }
}

// The provider has no separate compile-error status: a compile failure is a non-zero exit, no stdout, and the
// compiler's diagnostics (gcc: "code.cc:12:5: error:", javac single-file: "Main.java:12: error:") in stderr.
const COMPILE_ERROR = { cpp: /\bcode\.(cc|cpp):\d+(:\d+)?: (fatal )?error\b/, java: /\b\w+\.java:\d+: error:/ };

/**
 * createOnlineCompilerAdapter({ url, key, fetch, requestTimeoutMs }) -> { run }
 * url defaults to https://api.onlinecompiler.io; key is the account's REST API key (Authorization header, no prefix).
 */
export function createOnlineCompilerAdapter({ url = "https://api.onlinecompiler.io", key, fetch = globalThis.fetch, requestTimeoutMs = 40_000 }) {
  if (!key) throw new Error("The code runner key is not configured.");
  const endpoint = `${url.replace(/\/+$/, "")}/api/run-code-sync/`;
  return {
    async run({ language, source, stdin, timeoutMs, memoryMb }) {
      const compiler = RUNNER_COMPILERS[language];
      if (!compiler) throw new Error(`Unsupported language ${language}`);
      const body = {
        compiler: compiler.id,
        code: source,
        input: stdin,
        // The provider caps a run (compile included) at 30 s; the harness stops itself at its own budget first.
        time_limit: Math.min(30, Math.max(1, Math.ceil(timeoutMs / 1000))),
        memory_limit: Math.min(512, Math.max(16, memoryMb ?? 256)), // Free and Starter plans allow up to 512 MB
      };
      let res;
      try {
        res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", Authorization: key }, body: JSON.stringify(body), signal: AbortSignal.timeout(requestTimeoutMs) });
      } catch (error) {
        throw new JudgeUnavailableError(error?.name === "TimeoutError" ? "The code runner took too long to answer." : "The code runner couldn't be reached.");
      }
      if (res.status === 429) {
        const retry = Number(res.headers.get("retry-after"));
        // No Retry-After means the monthly allowance is used up.
        throw new JudgeUnavailableError(retry ? "The code runner is busy." : "The code runner's monthly limit is used up.", { retryAfter: retry || undefined });
      }
      if (!res.ok) throw new JudgeUnavailableError(`The code runner returned ${res.status}.`);
      const out = await res.json();
      const stdout = out.output ?? "";
      const stderr = out.error ?? "";
      const exit = Number(out.exit_code ?? 0);
      if (exit !== 0 && !stdout && COMPILE_ERROR[language]?.test(stderr)) return { compileError: stderr };
      return {
        stdout,
        stderr,
        exitCode: exit === 124 ? 0 : exit,
        timedOut: exit === 124,
        truncated: Boolean(out.truncated),
        memoryKb: out.memory != null ? Number(out.memory) : null,
      };
    },
  };
}
