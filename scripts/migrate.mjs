import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL belum tersedia. Jalankan melalui Vercel env atau isi .env.local.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const migrationsDir = path.join(process.cwd(), "db", "migrations");
const files = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`);

for (const filename of files) {
  const existing = await pool.query("SELECT filename FROM schema_migrations WHERE filename = $1", [filename]);
  if (existing.rowCount) continue;
  const body = await fs.readFile(path.join(migrationsDir, filename), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(body);
    await client.query("INSERT INTO schema_migrations(filename) VALUES($1)", [filename]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  console.log(`Applied ${filename}`);
}

console.log("Database schema is current.");
await pool.end();

