import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

import { toMedia } from "./media";
import type { Campaign, ColorSwatch, HomeSection, ProductSummary, Room } from "./types";

/**
 * Javni sloj podataka prodavnice. Komponente zovu samo ove funkcije, nikad Prismu direktno.
 * Svaka funkcija je keširana i označena tagom; admin posle izmene poziva
 * `revalidateTag(CACHE_TAGS.x, "max")` i sajt odmah prikazuje novo stanje.
 */
export const CACHE_TAGS = {
  campaigns: "campaigns",
  products: "products",
  categories: "categories",
  home: "home",
} as const;

// ─── Proizvodi ──────────────────────────────────────────────

/** Polja potrebna za karticu proizvoda; isti izbor za svaku listu proizvoda. */
const productSummarySelect = {
  id: true,
  slug: true,
  name: true,
  subtitle: true,
  priceRsd: true,
  compareAtRsd: true,
  isNew: true,
  images: { orderBy: { position: "asc" }, take: 2, select: { path: true, alt: true } },
  variants: {
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { colorName: true, colorHex: true, size: true },
  },
} satisfies Prisma.ProductSelect;

type ProductSummaryRow = Prisma.ProductGetPayload<{ select: typeof productSummarySelect }>;

function toProductSummary(row: ProductSummaryRow): ProductSummary {
  const [first, second] = row.images;

  const colors: ColorSwatch[] = [];
  for (const variant of row.variants) {
    if (variant.colorName && variant.colorHex && !colors.some((c) => c.name === variant.colorName)) {
      colors.push({ name: variant.colorName, hex: variant.colorHex });
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    priceRsd: row.priceRsd,
    compareAtRsd: row.compareAtRsd,
    isNew: row.isNew,
    image: toMedia(first?.path, first?.alt, row.name),
    hoverImage: second ? toMedia(second.path, second.alt, row.name) : null,
    colors,
    meta: colors.length === 0 ? (row.variants[0]?.size ?? null) : null,
  };
}

/** Samo objavljeni, aktivni proizvodi smeju na sajt. */
const visibleProduct = { status: "ACTIVE" } satisfies Prisma.ProductWhereInput;

export async function getProductGrid(source: "new" | "bestsellers", limit = 8): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  // „Najprodavanije“ će se računati iz porudžbina (faza 1, korak 6). Do tada: nova pa najnovija.
  const rows = await prisma.product.findMany({
    where: visibleProduct,
    orderBy: source === "new" ? [{ isNew: "desc" }, { publishedAt: "desc" }] : [{ publishedAt: "desc" }],
    take: limit,
    select: productSummarySelect,
  });

  return rows.map(toProductSummary);
}

// ─── Sobe ───────────────────────────────────────────────────

export async function getRooms(): Promise<Room[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);

  const rows = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { position: "asc" },
    select: { slug: true, name: true, description: true, imagePath: true, imageAlt: true },
  });

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: toMedia(row.imagePath, row.imageAlt, row.name),
  }));
}

// ─── Kampanja ───────────────────────────────────────────────

const campaignSelect = {
  slug: true,
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
  products: {
    orderBy: { position: "asc" },
    where: { product: visibleProduct },
    select: { product: { select: productSummarySelect } },
  },
} satisfies Prisma.CampaignSelect;

/**
 * Aktivna kampanja: zakazana kampanja čiji period obuhvata sadašnji trenutak,
 * a ako takve nema, podrazumevana (rezervna) kampanja.
 */
export async function getActiveCampaign(): Promise<Campaign> {
  "use cache";
  // Kampanje se smenjuju po datumu; nova se pojavi najkasnije ~15 min posle početka.
  cacheLife({ stale: 300, revalidate: 900, expire: 86_400 });
  cacheTag(CACHE_TAGS.campaigns);

  const now = new Date();
  const row =
    (await prisma.campaign.findFirst({
      where: { status: "SCHEDULED", startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: "desc" },
      select: campaignSelect,
    })) ??
    (await prisma.campaign.findFirst({
      where: { isDefault: true },
      select: campaignSelect,
    }));

  if (!row) throw new Error("Ne postoji ni aktivna ni podrazumevana kampanja. Pokrenite `npm run db:seed`.");

  const focal = { x: row.focalX, y: row.focalY };
  const heroAlt = row.heroImageAlt ?? row.headline;

  return {
    slug: row.slug,
    season: row.season,
    headline: row.headline,
    intro: row.intro,
    cta: { label: row.ctaLabel, href: row.ctaHref },
    layout: row.layout === "FULL_BLEED" ? "full-bleed" : "split",
    theme: row.theme === "ESPRESO" ? "espreso" : "kamen",
    image: { ...toMedia(row.heroImagePath, heroAlt), focal },
    imageMobile: row.heroImageMobilePath ? { ...toMedia(row.heroImageMobilePath, heroAlt), focal } : null,
    editorial:
      row.editorialTitle && row.editorialText
        ? {
            title: row.editorialTitle,
            text: row.editorialText,
            image: toMedia(row.editorialImagePath, row.editorialImageAlt, row.editorialTitle),
            href: row.ctaHref,
          }
        : null,
    products: row.products.map(({ product }) => toProductSummary(product)),
  };
}

// ─── Početna ────────────────────────────────────────────────

/** Uključene sekcije početne, redom iz admina (Početna → Sekcije). */
export async function getHomeSections(): Promise<HomeSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home);

  const rows = await prisma.homeSection.findMany({
    where: { isEnabled: true },
    orderBy: { position: "asc" },
  });

  return rows.map((row): HomeSection => {
    switch (row.type) {
      case "HERO":
        return { type: "hero" };
      case "COLLECTION_CAROUSEL":
        return { type: "collection-carousel" };
      case "ROOMS":
        return { type: "rooms" };
      case "EDITORIAL":
        return { type: "editorial" };
      case "PRODUCT_GRID": {
        const settings = row.settings as { source?: unknown } | null;
        return { type: "product-grid", source: settings?.source === "bestsellers" ? "bestsellers" : "new" };
      }
      case "BRAND_STORY":
        return { type: "brand-story" };
      case "GIFTS":
        return { type: "gifts" };
      case "SOCIAL":
        return { type: "social" };
      case "NEWSLETTER":
        return { type: "newsletter" };
    }
  });
}