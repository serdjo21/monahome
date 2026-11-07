import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Runtime ide preko Supabase transaction poolera (DATABASE_URL, port 6543).
// Za transakcije koje traže SERIALIZABLE izolaciju (rezervacija lagera) dodaje se
// zasebna direktna konekcija zajedno sa porudžbinama.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL nije podešen (vidi .env).");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;