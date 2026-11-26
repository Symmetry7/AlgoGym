// Staging-only SQL runner over the Supabase Management API: uses your `supabase login`, needs no database password,
// and never touches the linked (production) project. Run from the repo root:
//   node scripts/ops/staging-sql.mjs query "<sql>"                  prints rows as JSON
//   node scripts/ops/staging-sql.mjs file <path.sql>                runs a file in one transaction
//   node scripts/ops/staging-sql.mjs test <path.sql>                runs a self-contained test file (it rolls itself back)
//   node scripts/ops/staging-sql.mjs migrate supabase/migrations    applies pending migrations in order and records each in
//                                                                   supabase_migrations.schema_migrations, like `supabase db push`
// Every write and test starts with a guard that aborts unless the schema ag_staging_marker exists. That schema was created
// once, on the empty staging database only (docs/DECISIONS.md 2026-11-26).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";

const REF = "acopccydhtkbjslvtxrl";
const GUARD = `do $ag$ begin if to_regnamespace('ag_staging_marker') is null then raise exception 'REFUSING: not the staging database'; end if; end $ag$;\n`;
const tmp = mkdtempSync(join(tmpdir(), "ag-stg-"));

export function run(sql) {
  const f = join(tmp, "q.sql");
  writeFileSync(f, sql);
  const r = spawnSync("supabase", ["db", "query", "--linked", "--project-ref", REF, "-o", "json", "-f", f], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const out = (r.stdout || "") + (r.stderr || "");
  const json = (r.stdout || "").trim() || out.slice(out.indexOf("{"));
  let parsed;
  try { parsed = JSON.parse(json); } catch { parsed = { raw: out }; }
  if (r.status !== 0 || parsed._tag === "Error") return { error: parsed.error?.message ?? out };
  return { rows: parsed.rows ?? parsed };
}

const guarded = (body) => `${GUARD}begin;\n${body}\ncommit;\n`;
const lit = (s) => `'${s.replace(/'/g, "''")}'`;

const [cmd, arg, ...rest] = process.argv.slice(2);
if (cmd === "query") {
  const r = run(arg);
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.error ? 1 : 0);
} else if (cmd === "file") {
  const r = run(guarded(readFileSync(arg, "utf8")));
  console.log(r.error ? `ERROR ${r.error}` : "ok");
  process.exit(r.error ? 1 : 0);
} else if (cmd === "test") {
  // The file manages its own transaction (and rolls back).
  const r = run(GUARD + readFileSync(arg, "utf8"));
  console.log(r.error ? `FAILED ${r.error}` : "PASSED");
  process.exit(r.error ? 1 : 0);
} else if (cmd === "migrate") {
  const ledger = run(guarded(`create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key, statements text[], name text);`));
  if (ledger.error) { console.error(ledger.error); process.exit(1); }
  const done = new Set(run("select version from supabase_migrations.schema_migrations").rows.map((r) => r.version));
  const files = readdirSync(arg).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();
  let failed = 0;
  for (const f of files) {
    const [version, ...nameParts] = basename(f, ".sql").split("_");
    if (done.has(version)) continue;
    const body = readFileSync(join(arg, f), "utf8");
    const t = Date.now();
    const r = run(guarded(`${body}\n;\ninsert into supabase_migrations.schema_migrations (version, name, statements) values (${lit(version)}, ${lit(nameParts.join("_"))}, array[]::text[]);`));
    if (r.error) { console.log(`FAIL ${f}: ${r.error.slice(0, 1500)}`); failed++; if (!rest.includes("--keep-going")) break; }
    else console.log(`ok   ${f} (${Date.now() - t} ms)`);
  }
  process.exit(failed ? 1 : 0);
} else {
  console.error("usage: query|file|migrate");
  process.exit(2);
}
