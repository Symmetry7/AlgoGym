// Reads content/problems/<slug>/ folders (layout: docs/CONTENT_GUIDE.md). Shared by the validator, test generator and seeder.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { LANGUAGES, SOLUTION_FILE, HARNESS_FILE, starter, harness } from "../../packages/judge/src/index.mjs";

export const problemsDir = join(process.cwd(), "content/problems");

// `_template` is the format sample (status "example"): validated, never seeded.
export const listFolders = () =>
  readdirSync(problemsDir, { withFileTypes: true }).filter((d) => d.isDirectory() && (!d.name.startsWith("_") || d.name === "_template")).map((d) => d.name);

const read = (...p) => readFileSync(join(...p), "utf8");
const optional = (...p) => (existsSync(join(...p)) ? read(...p) : null);

export function loadProblem(folder) {
  const dir = join(problemsDir, folder);
  const meta = JSON.parse(read(dir, "meta.json"));
  const cases = [];
  for (const set of ["public", "hidden"]) {
    const files = existsSync(join(dir, "tests", set)) ? readdirSync(join(dir, "tests", set)).sort() : [];
    for (const f of files.filter((f) => f.endsWith(".in"))) {
      const id = f.slice(0, -3);
      const out = optional(dir, "tests", set, `${id}.out`);
      cases.push({ set, id, args: JSON.parse(read(dir, "tests", set, f)), expected: out == null ? undefined : JSON.parse(out), explain: optional(dir, "tests", set, `${id}.explain.md`) });
    }
  }
  const perLanguage = (fn) => Object.fromEntries(LANGUAGES.map((l) => [l, fn(l)]));
  return {
    folder,
    dir,
    meta,
    cases,
    statement: optional(dir, "statement.md"),
    hints: optional(dir, "hints.md"),
    editorial: optional(dir, "editorial.md"),
    solutions: perLanguage((l) => optional(dir, "solutions", SOLUTION_FILE[l])),
    // Per-language overrides win over the generated code.
    starters: perLanguage((l) => optional(dir, "starter", SOLUTION_FILE[l]) ?? starter(meta.signature, l)),
    harnesses: perLanguage((l) => optional(dir, "harness", HARNESS_FILE[l]) ?? harness(meta.signature, l, meta.comparator)),
    genPath: existsSync(join(dir, "tests", "gen.mjs")) ? join(dir, "tests", "gen.mjs") : null,
  };
}

export const importGen = (path) => import(pathToFileURL(path).href);

// Generated cases are tests/hidden/g01.in, g02.in, ...
export const genFileName = (i) => `g${String(i + 1).padStart(2, "0")}`;
