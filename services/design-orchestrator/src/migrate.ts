import { readFileSync, readdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import pg from "pg";

const { Pool } = pg;

const MIGRATIONS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../db/migrations",
);

export async function runMigrations(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      create table if not exists schema_migrations (
        version  text primary key,
        name     text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const { rows: applied } = await client.query(`select version from schema_migrations`);
    const appliedVersions = new Set(applied.map((r) => r.version as string));

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      if (appliedVersions.has(version)) continue;

      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), "utf-8");
      console.log(`[migrate] applying ${file}…`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `insert into schema_migrations (version, name) values ($1, $2)`,
          [version, file],
        );
        await client.query("COMMIT");
        console.log(`[migrate] applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].includes("migrate")) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const pool = new Pool({ connectionString });
  runMigrations(pool)
    .then(() => {
      console.log("[migrate] done");
      return pool.end();
    })
    .catch((err) => {
      console.error("[migrate] failed:", err);
      process.exit(1);
    });
}
