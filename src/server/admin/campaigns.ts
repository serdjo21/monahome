import "server-only";

import { prisma } from "@/server/db";

/** Sve kampanje: rezervna prva, pa najnovije po početku. */
export function listCampaigns() {
  return prisma.campaign.findMany({
    orderBy: [{ isDefault: "desc" }, { startsAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      season: true,
      status: true,
      isDefault: true,
      startsAt: true,
      endsAt: true,
      heroImagePath: true,
      _count: { select: { products: true } },
    },
  });
}

/** Kampanja koju sajt upravo prikazuje (ista logika kao getActiveCampaign na sajtu). */
export async function getShownCampaignId(now: Date): Promise<string | null> {
  const running = await prisma.campaign.findFirst({
    where: { status: "SCHEDULED", startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { startsAt: "desc" },
    select: { id: true },
  });
  if (running) return running.id;
  const fallback = await prisma.campaign.findFirst({ where: { isDefault: true }, select: { id: true } });
  return fallback?.id ?? null;
}

export function getAdminCampaign(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      isDefault: true,
      startsAt: true,
      endsAt: true,
      season: true,
      headline: true,
      intro: true,
      ctaLabel: true,
      ctaHref: true,
      layout: true,
      theme: true,
      heroImagePath: true,
      heroImageMobilePath: true,
      heroImageAlt: true,
      focalX: true,
      focalY: true,
      editorialTitle: true,
      editorialText: true,
      editorialImagePath: true,
      editorialImageAlt: true,
      previewToken: true,
      products: {
        orderBy: { position: "asc" },
        select: {
          product: {
            select: {
              id: true,
              name: true,
              status: true,
              priceRsd: true,
              images: { orderBy: { position: "asc" }, take: 1, select: { path: true } },
            },
          },
        },
      },
    },
  });
}

export type AdminCampaign = NonNullable<Awaited<ReturnType<typeof getAdminCampaign>>>;

/** Druge zakazane kampanje čiji se period preklapa sa datim (za upozorenje). */
export function findOverlapping(id: string, startsAt: Date, endsAt: Date) {
  return prisma.campaign.findMany({
    where: { id: { not: id }, status: "SCHEDULED", startsAt: { lte: endsAt }, endsAt: { gte: startsAt } },
    select: { id: true, name: true },
  });
}