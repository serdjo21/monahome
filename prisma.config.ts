import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// CLI (migracije, seed) koristi direktnu konekciju na portu 5432,
// jer transaction pooler (6543) ne podržava sve što migracije traže.
// Aplikacija u runtime-u koristi DATABASE_URL (pooler), vidi src/server/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});