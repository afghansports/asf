/**
 * One-shot migration runner. Connects directly to Postgres using
 * SUPABASE_DB_URL from .env.local and applies the combined migration file.
 *
 * Get your connection string from Supabase dashboard:
 *   Project Settings > Database > Connection string (URI / Direct connection)
 * Then add to .env.local:
 *   SUPABASE_DB_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
 *
 * Run:  node scripts/run-migrations.mjs supabase/migrations/COMBINED_015_to_021.sql
 */

import fs from "node:fs";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/run-migrations.mjs <path-to-sql-file>");
  process.exit(1);
}
if (!process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL in .env.local");
  console.error("Get it from Supabase dashboard > Project Settings > Database > Connection string");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");
const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log(`Connected. Running ${file} (${sql.length} chars)...`);
try {
  await client.query(sql);
  console.log("✓ Applied successfully.");
} catch (e) {
  console.error("✗ Failed:", e.message);
  console.error("  Hint:", e.hint ?? "(none)");
  console.error("  Position:", e.position ?? "(none)");
  process.exit(1);
} finally {
  await client.end();
}
