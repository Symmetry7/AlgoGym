// Validates every problem folder (docs/CONTENT_GUIDE.md): meta.json against its schema, files and tests, generated
// tests up to date, and in each of the 4 languages that the starter compiles and the reference solution passes every test.
// Usage (from the repo root): node scripts/data/validate-problems.mjs [folder...]
// Needs node, Python 3 (`py` on Windows, else `python3`; override with AG_PYTHON), g++ and a JDK on PATH.
import { readFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { LANGUAGES, generateInputs, judge, localAdapter } from "../../packages/judge/src/index.mjs";
import { genFileName, importGen, listFolders, loadProblem, problemsDir } from "../lib/problems.mjs";

const validateMeta = new Ajv2020({ allErrors: true }).compile(JSON.parse(readFileSync(join(problemsDir, "meta.schema.json"), "utf8")));
const SLACK_MS = 20_000; // process start-up (JVM, Python) is outside the harness's own budget

// Does JSON value `v` fit signature type `t`? Catches tests that would overflow C++/Java ints or break the typed readers.
function fits(t, v) {
  if (t.endsWith("[]")) return Array.isArray(v) && v.every((x) => fits(t.slice(0, -2), x));
  if (t === "int") return Number.isInteger(v) && v >= -(2 ** 31) && v < 2 ** 31;
  if (t === "long") return Number.isSafeInteger(v);
  if (t === "double") return typeof v === "number" && Number.isFinite(v);
  if (t === "bool") return typeof v === "boolean";
  if (t === "string") return typeof v === "string";
  return false;
}

async function validate(folder) {
  const errors = [], warnings = [];
  const p = loadProblem(folder);
  const { meta } = p;
  const example = meta.status === "example";

  if (!validateMeta(meta)) errors.push(...validateMeta.errors.map((e) => `meta.json ${e.instancePath || "/"} ${e.message}`));
  if (!example && meta.slug !== folder) errors.push(`meta.json slug "${meta.slug}" must equal the folder name`);
  if (meta.status === "ready" && !(meta.reviewers ?? []).some((r) => !meta.authors.includes(r))) errors.push("ready needs a reviewer who is not an author");
  for (const [name, text] of [["statement.md", p.statement], ["hints.md", p.hints], ["editorial.md", p.editorial]]) if (!text?.trim()) errors.push(`missing ${name}`);
  for (const l of LANGUAGES) if (!p.solutions[l]) errors.push(`missing ${l} reference solution`);
  if (errors.length) return { folder, errors, warnings };

  const { signature: sig } = meta;
  const pub = p.cases.filter((c) => c.set === "public"), hidden = p.cases.filter((c) => c.set === "hidden");
  if (pub.length < 2 || pub.length > 3) errors.push(`needs 2-3 public tests, has ${pub.length}`);
  if (!example && hidden.length < 10) errors.push(`needs at least 10 hidden tests, has ${hidden.length}`);
  for (const c of p.cases) {
    const where = `tests/${c.set}/${c.id}`;
    if (c.expected === undefined) { errors.push(`${where}.out is missing`); continue; }
    if (!Array.isArray(c.args) || c.args.length !== sig.params.length) { errors.push(`${where}.in must be a ${sig.params.length}-item argument list`); continue; }
    sig.params.forEach((prm, i) => { if (!fits(prm.type, c.args[i])) errors.push(`${where}.in argument ${prm.name} is not a valid ${prm.type}`); });
    if (!fits(sig.returns, c.expected)) errors.push(`${where}.out is not a valid ${sig.returns}`);
  }

  const genFiles = hidden.filter((c) => /^g\d+$/.test(c.id));
  if (p.genPath) {
    const inputs = generateInputs(await importGen(p.genPath));
    const stale = inputs.length !== genFiles.length || inputs.some((args, i) => genFiles[i]?.id !== genFileName(i) || JSON.stringify(args) !== JSON.stringify(genFiles[i].args));
    if (stale) errors.push("generated tests are out of date: run npm run content:gen -- " + folder);
  } else if (genFiles.length) errors.push("tests/hidden/g*.in exist but tests/gen.mjs does not");
  if (errors.length) return { folder, errors, warnings };

  const cases = p.cases.map((c) => ({ args: c.args, expected: c.expected }));
  const slowest = {};
  await Promise.all(LANGUAGES.map(async (language) => {
    const run = (code, cs) => judge({ adapter: localAdapter, language, harness: p.harnesses[language], code, cases: cs, limits: meta.limits, comparator: meta.comparator, slackMs: SLACK_MS });

    const st = await run(p.starters[language], cases.slice(0, 1));
    if (st.compileError) errors.push(`${language} starter does not compile:\n${st.compileError}`);
    else if (st.cases[0].verdict === "runtime_error") errors.push(`${language} starter crashes: ${st.cases[0].error ?? ""}`);

    const res = await run(p.solutions[language], cases);
    if (res.compileError) { errors.push(`${language} solution does not compile:\n${res.compileError}`); return; }
    res.cases.forEach((r, i) => {
      if (r.verdict !== "accepted") {
        const c = p.cases[i];
        errors.push(`${language} ${c.set}/${c.id}: ${r.verdict}${r.error ? ` ${r.error.slice(0, 300)}` : ""}${r.verdict === "wrong_answer" ? ` (got ${JSON.stringify(r.output).slice(0, 80)}, want ${JSON.stringify(c.expected).slice(0, 80)})` : ""}`);
      }
    });
    slowest[language] = Math.round(Math.max(0, ...res.cases.map((r) => r.ms ?? 0)));
    // CONTENT_GUIDE: the limit should give reference solutions ~3x margin.
    if (slowest[language] * 3 > meta.limits.time_ms_per_case) warnings.push(`${language} reference takes ${slowest[language]} ms, under 3x margin of ${meta.limits.time_ms_per_case} ms`);
  }));
  return { folder, errors, warnings, cases: cases.length, slowest };
}

const only = process.argv.slice(2);
const folders = listFolders().filter((f) => !only.length || only.includes(f));
const unknown = only.filter((f) => !folders.includes(f));
if (unknown.length) { console.error(`Unknown problem folder(s): ${unknown.join(", ")}`); process.exit(1); }

// A few problems at a time: each runs its 4 languages in parallel.
const results = [];
const queue = [...folders];
await Promise.all(Array.from({ length: Math.max(1, Math.floor(availableParallelism() / 4)) }, async () => {
  while (queue.length) {
    const folder = queue.shift();
    let r;
    try { r = await validate(folder); } catch (e) { r = { folder, errors: [String(e.stack ?? e)], warnings: [] }; }
    results.push(r);
    const timing = r.slowest ? `  slowest ms ${LANGUAGES.map((l) => `${l} ${r.slowest[l]}`).join(", ")}` : "";
    console.log(`${r.errors.length ? "FAIL" : "ok  "} ${folder}${r.cases ? ` (${r.cases} cases x 4 languages)` : ""}${timing}`);
    for (const e of r.errors) console.log(`     error: ${e}`);
    for (const w of r.warnings) console.log(`     warn:  ${w}`);
  }
}));

const failed = results.filter((r) => r.errors.length);
console.log(`\n${results.length - failed.length}/${results.length} problems valid${failed.length ? `; failing: ${failed.map((r) => r.folder).join(", ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
