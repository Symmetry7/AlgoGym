// Writes seeded max-size tests: content/problems/<slug>/tests/gen.mjs -> tests/hidden/gNN.in, with gNN.out from the
// JavaScript reference solution (the validator then checks all 4 languages agree).
// Usage (from the repo root): node scripts/data/generate-tests.mjs [folder...]
import { readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  generateInputs,
  judge,
  localAdapter,
} from "../../packages/judge/src/index.mjs";
import {
  genFileName,
  importGen,
  listFolders,
  loadProblem,
} from "../lib/problems.mjs";

async function referenceOutputs(problem, inputs) {
  const res = await judge({
    adapter: localAdapter,
    language: "javascript",
    harness: problem.harnesses.javascript,
    code: problem.solutions.javascript,
    cases: inputs.map((args) => ({ args, expected: null })),
    limits: { time_ms_per_case: 60_000, max_total_ms: 600_000, memory_mb: 512 },
    comparator: "exact",
  });
  const bad = res.cases.find((c) => !("output" in c));
  if (bad)
    throw new Error(
      `${problem.folder}: reference solution failed on generated case ${bad.case}: ${bad.verdict} ${bad.error ?? ""}`,
    );
  return res.cases.map((c) => c.output);
}

const only = process.argv.slice(2);
for (const folder of listFolders().filter(
  (f) => !only.length || only.includes(f),
)) {
  const problem = loadProblem(folder);
  if (!problem.genPath) continue;
  const inputs = generateInputs(await importGen(problem.genPath));
  const outputs = await referenceOutputs(problem, inputs);
  const hidden = join(problem.dir, "tests", "hidden");
  for (const f of readdirSync(hidden).filter((f) => /^g\d+\.(in|out)$/.test(f)))
    rmSync(join(hidden, f));
  inputs.forEach((args, i) => {
    writeFileSync(
      join(hidden, `${genFileName(i)}.in`),
      JSON.stringify(args) + "\n",
    );
    writeFileSync(
      join(hidden, `${genFileName(i)}.out`),
      JSON.stringify(outputs[i]) + "\n",
    );
  });
  console.log(`${folder}: wrote ${inputs.length} generated cases`);
}
