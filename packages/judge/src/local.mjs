// Local adapter: compiles and runs TRUSTED code (reference solutions, generated starters) on this machine or the CI runner.
// shortcut: no sandbox and no memory limit; never run user code with it. Judge0 (M11) enforces both.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const python = process.env.AG_PYTHON ?? (process.platform === "win32" ? "py" : "python3");
const exe = process.platform === "win32" ? "main.exe" : "main";

const toolchain = {
  javascript: { file: "main.cjs", run: (d) => ["node", ["--stack-size=65500", join(d, "main.cjs")]] },
  python: { file: "main.py", run: (d) => [python, [join(d, "main.py")]] },
  cpp: { file: "main.cpp", compile: (d) => ["g++", ["-std=c++17", "-O2", "-o", join(d, exe), join(d, "main.cpp")]], run: (d) => [join(d, exe), []] },
  java: { file: "Main.java", compile: (d) => ["javac", ["-encoding", "UTF-8", "-d", d, join(d, "Main.java")]], run: (d) => ["java", ["-cp", d, "Main"]] },
};

// Windows launchers (e.g. Oracle's javapath java.exe) run the real program as a child, so kill the whole tree.
const kill = (child) => (process.platform === "win32" ? spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]) : child.kill("SIGKILL"));

function exec(cmd, args, { stdin = "", timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const out = [], err = [];
    let timedOut = false;
    const timer = timeoutMs ? setTimeout(() => { timedOut = true; kill(child); }, timeoutMs) : null;
    child.stdout.on("data", (b) => out.push(b));
    child.stderr.on("data", (b) => err.push(b));
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout: Buffer.concat(out).toString("utf8"), stderr: Buffer.concat(err).toString("utf8"), exitCode: code ?? -1, timedOut });
    });
    child.stdin.on("error", () => {}); // the program may exit before reading all input
    child.stdin.end(stdin);
  });
}

export const localAdapter = {
  async run({ language, source, stdin, timeoutMs }) {
    const tc = toolchain[language];
    if (!tc) throw new Error(`Unknown language ${language}`);
    const dir = mkdtempSync(join(tmpdir(), "ag-judge-"));
    try {
      writeFileSync(join(dir, tc.file), source);
      if (tc.compile) {
        const [cmd, args] = tc.compile(dir);
        const c = await exec(cmd, args, { timeoutMs: 120_000 });
        if (c.exitCode !== 0) return { compileError: (c.stderr || c.stdout).slice(-4000) };
      }
      const [cmd, args] = tc.run(dir);
      return await exec(cmd, args, { stdin, timeoutMs });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
};
