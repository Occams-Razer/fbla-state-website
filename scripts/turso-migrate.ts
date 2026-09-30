/**
 * Applies prisma/migrations/<name>/migration.sql files to the Turso database.
 * The Prisma CLI can't connect to libsql:// URLs, so this runs the SQL directly
 * and records what has been applied in a _turso_migrations table.
 *
 * Run: npm run db:migrate:turso
 * Requires: DATABASE_URL (libsql://...) and DATABASE_AUTH_TOKEN
 */
import "dotenv/config";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Set DATABASE_URL (libsql://...) and DATABASE_AUTH_TOKEN first.");
  process.exit(1);
}

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN?.trim() || undefined,
});

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

async function main() {
  await client.execute(
    `CREATE TABLE IF NOT EXISTS "_turso_migrations" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  const applied = new Set(
    (await client.execute(`SELECT "name" FROM "_turso_migrations"`)).rows.map((r) =>
      String(r.name),
    ),
  );

  const pending = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .filter((name) => existsSync(path.join(migrationsDir, name, "migration.sql")))
    .filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log("Turso database is up to date.");
    return;
  }

  for (const name of pending) {
    const sql = readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8");
    await client.executeMultiple(sql);
    await client.execute({
      sql: `INSERT INTO "_turso_migrations" ("name") VALUES (?)`,
      args: [name],
    });
    console.log(`Applied ${name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.close());
