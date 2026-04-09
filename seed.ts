import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword || rawPassword.length < 8) {
    throw new Error(
      "Set SEED_ADMIN_PASSWORD in .env (min 8 characters) before running seed.",
    );
  }
  const hashedAdminPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { password: hashedAdminPassword },
    create: {
      username: "admin",
      password: hashedAdminPassword,
    },
  });

  console.log("Database seeded with ENCRYPTED admin credentials!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
