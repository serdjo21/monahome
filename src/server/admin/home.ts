import "server-only";

import type { HomeSectionType } from "@/generated/prisma/enums";
import { HOME_SECTION_ORDER } from "@/lib/home-content";
import { prisma } from "@/server/db";

/**
 * Sve sekcije početne redom, hero uvek prvi. Ako u bazi neka sekcija ne postoji
 * (npr. nova produkciona baza bez seeda), napravi se na svom podrazumevanom mestu.
 */
export async function getAdminHomeSections() {
  await prisma.homeSection.createMany({
    data: HOME_SECTION_ORDER.map((type, position) => ({
      type,
      position,
      settings: type === "PRODUCT_GRID" ? { source: "new" } : undefined,
    })),
    skipDuplicates: true,
  });

  const rows = await prisma.homeSection.findMany({ orderBy: { position: "asc" } });
  return [...rows.filter((row) => row.type === "HERO"), ...rows.filter((row) => row.type !== "HERO")];
}

export function settingsOf(rows: Awaited<ReturnType<typeof getAdminHomeSections>>, type: HomeSectionType) {
  return rows.find((row) => row.type === type)?.settings ?? null;
}