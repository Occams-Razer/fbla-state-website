import { PrismaLibSql } from "@prisma/adapter-libsql";

function firstSet(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/**
 * Resolves the libSQL connection settings.
 * - Production (Vercel): DATABASE_URL=libsql://<db>.turso.io + DATABASE_AUTH_TOKEN,
 *   or TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (as set by the Vercel Turso integration)
 * - Local dev: unset or file:./dev.db (plain SQLite file)
 */
export function resolveDbConfig(): { url: string; authToken?: string } {
  return {
    url: firstSet(process.env.DATABASE_URL, process.env.TURSO_DATABASE_URL) ?? "file:./dev.db",
    authToken: firstSet(process.env.DATABASE_AUTH_TOKEN, process.env.TURSO_AUTH_TOKEN),
  };
}

/**
 * Builds the Prisma driver adapter for libSQL.
 * Kept free of "@/..." imports so the seed scripts can use it too.
 */
export function createDbAdapter(): PrismaLibSql {
  return new PrismaLibSql(resolveDbConfig());
}
