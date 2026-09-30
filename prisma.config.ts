import { defineConfig } from "prisma/config";

// The Prisma CLI only talks to local SQLite files. When DATABASE_URL points at
// Turso (libsql://...), keep CLI commands on dev.db and use
// `npm run db:migrate:turso` to apply migrations to Turso instead.
const envUrl = process.env.DATABASE_URL?.trim();
const cliUrl = envUrl?.startsWith("file:") ? envUrl : "file:./dev.db";

// prisma-erd-generator renders ERD.svg with headless Chrome, which can't launch
// on Vercel/CI build machines (missing system libraries). Skip it there.
if (process.env.VERCEL || process.env.CI) {
  process.env.DISABLE_ERD ??= "true";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./seed-all.ts",
  },
  datasource: {
    url: cliUrl,
  },
});
