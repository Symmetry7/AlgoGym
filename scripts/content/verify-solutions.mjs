// Runs every reference solution (js, py, cpp, java) against every test of every problem.
// Usage (from the repo root): node scripts/content/verify-solutions.mjs [slug...]
// Needs node, Python 3 (py on Windows, python3 elsewhere), g++ and a JDK on PATH. Temporary until the M5 validator.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { isDeepStrictEqual } from "node:util";

const root = process.cwd();
const only = process.argv.slice(2);
const work = join(tmpdir(), "algogym-verify");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const cppType = { int: "int", long: "long long", bool: "bool", string: "string", "int[]": "vector<int>", "long[]": "vector<long long>", "string[]": "vector<string>" };

// Inputs for the compiled drivers: whitespace tokens; arrays are "n v1 .. vn".
const tokens = (args, params) => params.map((p, i) => (p.type.endsWith("[]") ? [args[i].length, ...args[i]].join(" ") : String(args[i]))).join("\n") + "\n";

const cppDriver = (sig) => {
  const reads = sig.params.map((p) => (p.type.endsWith("[]")
    ? `${cppType[p.type]} ${p.name}; { int n; cin >> n; ${p.name}.resize(n); for (auto& x : ${p.name}) cin >> x; }`
    : `${cppType[p.type]} ${p.name}; cin >> ${p.name};`)).join("\n  ");
  const print = {
    int: "cout << r;", long: "cout << r;", bool: 'cout << (r ? "true" : "false");', string: 'cout << \'"\' << r << \'"\';',
    "int[]": "cout << '['; for (size_t i = 0; i < r.size(); i++) { if (i) cout << ','; cout << r[i]; } cout << ']';",
    "long[]": "cout << '['; for (size_t i = 0; i < r.size(); i++) { if (i) cout << ','; cout << r[i]; } cout << ']';",
  }[sig.returns];
  return `#include <iostream>\nint main() {\n  ios::sync_with_stdio(false); cin.tie(nullptr);\n  ${reads}\n  auto r = Solution().${sig.function}(${sig.params.map((p) => p.name).join(", ")});\n  ${print}\n  cout << endl;\n}\n`;
};

const javaDriver = (sig) => {
  const reads = sig.params.map((p) => {
    if (p.type === "int[]") return `int[] ${p.name} = new int[Integer.parseInt(tok__[at__++])]; for (int i = 0; i < ${p.name}.length; i++) ${p.name}[i] = Integer.parseInt(tok__[at__++]);`;
    if (p.type === "string[]") return `String[] ${p.name} = new String[Integer.parseInt(tok__[at__++])]; for (int i = 0; i < ${p.name}.length; i++) ${p.name}[i] = tok__[at__++];`;
    if (p.type === "long[]") return `long[] ${p.name} = new long[Integer.parseInt(tok__[at__++])]; for (int i = 0; i < ${p.name}.length; i++) ${p.name}[i] = Long.parseLong(tok__[at__++]);`;
    if (p.type === "int") return `int ${p.name} = Integer.parseInt(tok__[at__++]);`;
    if (p.type === "long") return `long ${p.name} = Long.parseLong(tok__[at__++]);`;
    return `String ${p.name} = tok__[at__++];`;
  }).join("\n    ");
  const print = {
    int: "out = String.valueOf(r);", long: "out = String.valueOf(r);", bool: "out = String.valueOf(r);", string: 'out = "\\"" + r + "\\"";',
    "int[]": 'StringBuilder sb = new StringBuilder("["); for (int i = 0; i < r.length; i++) { if (i > 0) sb.append(\',\'); sb.append(r[i]); } out = sb.append(\']\').toString();',
    "long[]": 'StringBuilder sb = new StringBuilder("["); for (int i = 0; i < r.length; i++) { if (i > 0) sb.append(\',\'); sb.append(r[i]); } out = sb.append(\']\').toString();',
  }[sig.returns];
  return `import java.io.*;\npublic class Main {\n  public static void main(String[] a) throws IOException {\n    String[] tok__ = new String(System.in.readAllBytes()).trim().split("\\\\s+"); int at__ = 0;\n    ${reads}\n    var r = new Solution().${sig.function}(${sig.params.map((p) => p.name).join(", ")});\n    String out; ${print}\n    System.out.println(out);\n  }\n}\n`;
};

let failures = 0;
const slugs = readdirSync(join(root, "content/problems")).filter((s) => !s.startsWith("_") && !s.endsWith(".json") && (!only.length || only.includes(s)));
for (const slug of slugs) {
  const dir = join(root, "content/problems", slug);
  const sig = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")).signature;
  const w = join(work, slug);
  mkdirSync(w, { recursive: true });
  writeFileSync(join(w, "run.js"), readFileSync(join(dir, "solutions/solution.js"), "utf8") +
    `\nconst args = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));\nconsole.log(JSON.stringify(${sig.function}(...args)));\n`);
  writeFileSync(join(w, "run.py"), readFileSync(join(dir, "solutions/solution.py"), "utf8") +
    `\n\nimport json, sys\nargs = json.load(open(sys.argv[1]))\nprint(json.dumps(Solution().${sig.function}(*args)))\n`);
  writeFileSync(join(w, "run.cpp"), readFileSync(join(dir, "solutions/solution.cpp"), "utf8") + "\n" + cppDriver(sig));
  writeFileSync(join(w, "Solution.java"), readFileSync(join(dir, "solutions/Solution.java"), "utf8"));
  writeFileSync(join(w, "Main.java"), javaDriver(sig));
  execFileSync("g++", ["-std=c++14", "-O2", "-o", join(w, "run.exe"), join(w, "run.cpp")], { stdio: "inherit" });
  execFileSync("javac", ["-d", w, join(w, "Solution.java"), join(w, "Main.java")], { stdio: "inherit" });

  const cases = ["public", "hidden"].flatMap((set) => readdirSync(join(dir, "tests", set)).filter((f) => f.endsWith(".in")).map((f) => [set, f.slice(0, -3)]));
  const slowest = {};
  for (const [set, id] of cases) {
    const inPath = join(dir, "tests", set, `${id}.in`);
    const args = JSON.parse(readFileSync(inPath, "utf8"));
    const want = JSON.parse(readFileSync(join(dir, "tests", set, `${id}.out`), "utf8"));
    const tokPath = join(w, `${set}-${id}.txt`);
    writeFileSync(tokPath, tokens(args, sig.params));
    const runs = {
      js: ["node", [join(w, "run.js"), inPath]],
      py: [process.platform === "win32" ? "py" : "python3", [join(w, "run.py"), inPath]],
      cpp: [join(w, "run.exe"), [], tokPath],
      java: ["java", ["-Xss64m", "-cp", w, "Main"], tokPath],
    };
    for (const [lang, [cmd, cmdArgs, stdinFile]] of Object.entries(runs)) {
      const start = Date.now();
      const res = spawnSync(cmd, cmdArgs, { input: stdinFile ? readFileSync(stdinFile) : undefined, maxBuffer: 64 * 1024 * 1024, encoding: "utf8" });
      const ms = Date.now() - start;
      slowest[lang] = Math.max(slowest[lang] ?? 0, ms);
      let got;
      try { got = JSON.parse(res.stdout.trim()); } catch { got = `<unparsable: ${res.stdout.slice(0, 80)} ${res.stderr.slice(0, 200)}>`; }
      if (!isDeepStrictEqual(got, want)) {
        failures++;
        console.log(`FAIL ${slug} ${lang} ${set}/${id}: want ${JSON.stringify(want).slice(0, 60)} got ${JSON.stringify(got).slice(0, 60)}`);
      }
    }
  }
  console.log(`${slug}: ${cases.length} cases x 4 languages; slowest ms ${JSON.stringify(slowest)}`);
}
console.log(failures ? `${failures} FAILURES` : "ALL PASS");
process.exit(failures ? 1 : 0);
