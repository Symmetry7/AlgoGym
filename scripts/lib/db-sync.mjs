// Shared by the data scripts (seed-problems, import-companies): connect with a service-role key from an env file,
// and write tables idempotently by diffing against what is stored, so a second run reports 0 changes.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_REF = "sfnmcgcxerbqceujzbqv";

/** Reads `--env <file>` (default .env.staging.local); refuses production unless `--production`. */
export function connect(argv, verb) {
  const envFile = argv.includes("--env") ? argv[argv.indexOf("--env") + 1] : ".env.staging.local";
  const env = parseEnv(readFileSync(envFile, "utf8"));
  const url = env.STAGING_SUPABASE_URL ?? env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.STAGING_SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`${envFile} needs a Supabase URL and service-role key`);
  if (url.includes(PRODUCTION_REF) && !argv.includes("--production")) throw new Error(`Refusing to ${verb} production without --production`);
  const dryRun = argv.includes("--dry-run");
  console.log(`${verb[0].toUpperCase() + verb.slice(1)} ${new URL(url).hostname.split(".")[0]}${dryRun ? " (dry run)" : ""}`);
  return { db: createClient(url, key, { auth: { persistSession: false } }), dryRun };
}

// Stable JSON for comparing stored jsonb (Postgres reorders object keys) with local values.
export const canon = (v) => JSON.stringify(v, (_, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
export const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data; };

/** Every row matching `scope` ({col: value | [values]}), 1000 per request, in `orderBy` order (required: paging without a stable order can skip or repeat rows). */
export async function readAll(db, table, scope, columns, orderBy) {
  if (!orderBy?.length) throw new Error(`readAll(${table}) needs orderBy`);
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(columns).range(from, from + 999);
    for (const [col, val] of Object.entries(scope)) q = Array.isArray(val) ? q.in(col, val) : q.eq(col, val);
    for (const col of orderBy) q = q.order(col);
    const page = must(await q, `read ${table}`);
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

export function makeSync(db, { dryRun }) {
  const counts = { insert: 0, update: 0, delete: 0 };
  /** Bring `table` rows matching `scope` in line with `want`, keyed by `keyCols`. `keep: true` never deletes. */
  async function sync(table, scope, keyCols, want, { keep = false } = {}) {
    if (Object.values(scope).some((v) => Array.isArray(v) && !v.length)) return;
    const have = await readAll(db, table, scope, "*", keyCols);
    const k = (r) => keyCols.map((c) => r[c]).join("|");
    const byKey = new Map(have.map((r) => [k(r), r]));
    const inserts = [], updates = [];
    for (const row of want) {
      const old = byKey.get(k(row));
      byKey.delete(k(row));
      if (!old) inserts.push(row);
      else if (Object.keys(row).some((c) => canon(row[c]) !== canon(old[c]))) updates.push(row);
    }
    const deletes = keep ? [] : [...byKey.values()];
    counts.insert += inserts.length; counts.update += updates.length; counts.delete += deletes.length;
    if (!dryRun) {
      const writes = [...inserts, ...updates];
      for (let i = 0; i < writes.length; i += 500) must(await db.from(table).upsert(writes.slice(i, i + 500), { onConflict: keyCols.join(",") }), `write ${table}`);
      for (const row of deletes) {
        let q = db.from(table).delete();
        for (const c of keyCols) q = q.eq(c, row[c]);
        must(await q, `delete ${table}`);
      }
    }
    if (inserts.length + updates.length + deletes.length) console.log(`  ${table}: +${inserts.length} ~${updates.length} -${deletes.length}`);
  }
  return { sync, counts };
}

export const summary = (counts, what) => {
  const total = counts.insert + counts.update + counts.delete;
  return `${what}: ${counts.insert} inserted, ${counts.update} updated, ${counts.delete} deleted${total ? "" : " (no changes)"}`;
};
