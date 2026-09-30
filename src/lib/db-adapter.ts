import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Builds the Prisma driver adapter for libSQL.
 * - Production (Vercel): DATABASE_URL=libsql://<db>.turso.io + DATABASE_AUTH_TOKEN
 * - Local dev: DATABASE_URL unset or file:./dev.db (plain SQLite file)
 *
 * Kept free of "@/..." imports so the seed scripts can use it too.
 */
export function createDbAdapter(): PrismaLibSql {
  const url = process.env.DATABASE_URL?.trim() || "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;
  return new PrismaLibSql({ url, authToken });
}
