/**
 * Seeds the Admin user (bcrypt password). Run: npm run db:seed
 * Requires: SEED_ADMIN_PASSWORD (min 8 chars). Uses DATABASE_URL (+ DATABASE_AUTH_TOKEN for Turso), defaults to file:./dev.db
 * Optional: SEED_ADMIN_USERNAME (default: admin)
 */
import "dotenv/config";
import { PrismaClient } from "./src/generated/client";
import { createDbAdapter } from "./src/lib/db-adapter";
import bcrypt from "bcryptjs";

declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

const prisma = new PrismaClient({ adapter: createDbAdapter() });

async function main() {
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword || rawPassword.length < 8) {
    throw new Error(
      "Set SEED_ADMIN_PASSWORD in .env (min 8 characters) before running seed.",
    );
  }

  const username =
    (process.env.SEED_ADMIN_USERNAME ?? "admin").trim() || "admin";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { password: hashedPassword },
    create: {
      username,
      password: hashedPassword,
    },
  });

  console.log(
    `Database seeded: admin username "${username}" (password from SEED_ADMIN_PASSWORD).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
