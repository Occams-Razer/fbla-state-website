import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx ./seed-all.ts",
  },
  datasource: {
    url: "file:./dev.db",
  },
});
