import "dotenv/config";
import { defineConfig } from "prisma/config";

// CLI (migracije, seed) koristi direktnu konekciju na portu 5432,
// jer transaction pooler (6543) ne podržava sve što migracije traže.
// Aplikacija u runtime-u koristi DATABASE_URL (pooler), vidi src/server/db.ts.
// Za `prisma generate` (npm install na Vercelu) adresa nije potrebna, pa nije obavezna.
const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
});