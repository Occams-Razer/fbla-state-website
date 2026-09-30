import { defineConfig } from "prisma/config";

// The Prisma CLI only talks to local SQLite files. When DATABASE_URL points at
// Turso (libsql://...), keep CLI commands on dev.db and use
// `npm run db:migrate:turso` to apply migrations to Turso instead.
const envUrl = process.env.DATABASE_URL?.trim();
const cliUrl = envUrl?.startsWith("file:") ? envUrl : "file:./dev.db";

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
