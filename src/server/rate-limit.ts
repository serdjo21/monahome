// src/server/rate-limit.ts
import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";
import { after } from "next/server";

import { prisma } from "@/server/db";

/**
 * Limiti po IP adresi. Namerno blagi: mobilni operateri daju istu IP adresu mnogim korisnicima.
 * Glavna zaštita od botova je Turnstile; ovo je druga linija.
 */
const LIMITS = {
  checkout: { max: 10, windowSeconds: 10 * 60 },
  login: { max: 20, windowSeconds: 15 * 60 },
  password_reset: { max: 5, windowSeconds: 60 * 60 },
  newsletter: { max: 5, windowSeconds: 60 * 60 },
} as const;

export type RateLimitName = keyof typeof LIMITS;

/** Prva adresa iz x-forwarded-for (Vercel je postavlja sam, klijent je ne može podmetnuti). */
async function clientIp(): Promise<string | null> {
  const value = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  return value || null;
}

/**
 * Broji zahtev i vraća da li je dozvoljen. Fiksni prozor: prvi zahtev otvara prozor,
 * posle isteka brojač kreće od 1. Jedan upit (INSERT … ON CONFLICT), bez trke između dva zahteva.
 * Greška baze: propušta i beleži, da kvar brojača ne zaustavi prodaju.
 */
export async function checkRateLimit(name: RateLimitName): Promise<boolean> {
  const ip = await clientIp();
  if (!ip) return true; // Lokalno nema x-forwarded-for.

  const { max, windowSeconds } = LIMITS[name];
  // Čuva se samo heš, ne IP adresa.
  const key = `${name}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;

  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, (now() AT TIME ZONE 'UTC') + make_interval(secs => ${windowSeconds}::float8))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count"
    `;

    // Povremeno (oko 1 od 50 zahteva) obriši redove istekle pre više od dana, posle odgovora.
    if (Math.random() < 0.02) {
      after(() =>
        prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < (now() AT TIME ZONE 'UTC') - interval '1 day'`.catch(
          (error) => console.error("[rate-limit] Čišćenje nije uspelo:", error),
        ),
      );
    }

    const count = Number(rows[0]?.count ?? 0);
    if (count > max) {
      console.warn(`[rate-limit] ${name}: prekoračen limit (${count}/${max})`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[rate-limit] Greška:", error);
    return true;
  }
}