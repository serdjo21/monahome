import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { toMedia } from "./media";
import type {
  Campaign,
  ColorSwatch,
  GiftsContent,
  HomeSection,
  NavLink,
  ProductDetail,
  ProductSummary,
  Room,
  RoomDetail,
  RoomSort,
  SocialContent,
} from "./types";
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

/** Slugovi svih objavljenih proizvoda, za generisanje stranica pri buildu. */
export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  const rows = await prisma.product.findMany({ where: visibleProduct, select: { slug: true } });
  return rows.map((row) => row.slug);
}

/**
 * Sve za stranicu proizvoda. Stanje lagera je keširano kao i ostatak (admin i porudžbine osvežavaju tag);
 * konačna provera količine je uvek pri porudžbini, ne ovde.
 */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  const row = await prisma.product.findFirst({
    where: { slug, ...visibleProduct },
    select: {
      id: true,
      slug: true,
      name: true,
      subtitle: true,
      description: true,
      care: true,
      priceRsd: true,
      compareAtRsd: true,
      isNew: true,
      images: {
        orderBy: { position: "asc" },
        select: { path: true, alt: true, variant: { select: { colorName: true } } },
      },
      variants: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: { id: true, sku: true, colorName: true, colorHex: true, size: true, priceRsd: true, stock: true, reserved: true },
      },
      categories: {
        where: { category: { isVisible: true } },
        orderBy: { category: { position: "asc" } },
        take: 1,
        select: { category: { select: { slug: true, name: true } } },
      },
    },
  });
  if (!row) return null;

  const colors: ColorSwatch[] = [];
  const sizes: string[] = [];
  for (const variant of row.variants) {
    if (variant.colorName && variant.colorHex && !colors.some((c) => c.name === variant.colorName)) {
      colors.push({ name: variant.colorName, hex: variant.colorHex });
    }
    if (variant.size && !sizes.includes(variant.size)) sizes.push(variant.size);
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    care: row.care,
    priceRsd: row.priceRsd,
    compareAtRsd: row.compareAtRsd,
    isNew: row.isNew,
    room: row.categories[0]?.category ?? null,
    images: row.images.map((image) => ({
      ...toMedia(image.path, image.alt, row.name),
      colorName: image.variant?.colorName ?? null,
    })),
    colors,
    sizes,
    variants: row.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      colorName: variant.colorName,
      size: variant.size,
      priceRsd: variant.priceRsd ?? row.priceRsd,
      available: Math.max(0, variant.stock - variant.reserved),
    })),
  };
}

/** „Iz iste sobe“: ostali proizvodi iz sobe, najnoviji prvo. Bez sobe: najnoviji uopšte. */
export async function getRelatedProducts(productId: string, roomSlug: string | null, limit = 8): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  const rows = await prisma.product.findMany({
    where: {
      ...visibleProduct,
      id: { not: productId },
      ...(roomSlug ? { categories: { some: { category: { slug: roomSlug } } } } : {}),
    },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }],
    take: limit,
    select: productSummarySelect,
  });

  return rows.map(toProductSummary);
}

// ─── Sobe ───────────────────────────────────────────────────

const roomSelect = {
  slug: true,
  name: true,
  description: true,
  imagePath: true,
  imageAlt: true,
} satisfies Prisma.CategorySelect;

function toRoom(row: Prisma.CategoryGetPayload<{ select: typeof roomSelect }>): Room {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: toMedia(row.imagePath, row.imageAlt, row.name),
  };
}

export async function getRooms(): Promise<Room[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);

  const rows = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { position: "asc" },
    select: roomSelect,
  });

  return rows.map(toRoom);
}

/** Jedna soba po slugu; null ako ne postoji ili je sakrivena (stranica tada vraća 404). */
const roomDetailSelect = {
  ...roomSelect,
  heroTheme: true,
  heroImagePath: true,
  heroImageMobilePath: true,
  heroImageAlt: true,
  heroFocalX: true,
  heroFocalY: true,
  editorialText: true,
  editorialImagePath: true,
  editorialImageAlt: true,
} satisfies Prisma.CategorySelect;

/** Jedna soba po slugu, sa herojem i editorijalom; null ako ne postoji ili je sakrivena (404). */
export async function getRoom(slug: string): Promise<RoomDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);

  const row = await prisma.category.findFirst({
    where: { slug, isVisible: true },
    select: roomDetailSelect,
  });
  if (!row) return null;

  const focal = { x: row.heroFocalX, y: row.heroFocalY };
  const heroAlt = row.heroImageAlt ?? row.name;
  const heroImage = toMedia(row.heroImagePath, heroAlt);
  const heroImageMobile = toMedia(row.heroImageMobilePath, heroAlt);

  return {
    ...toRoom(row),
    hero: {
      theme: row.heroTheme === "KAMEN" ? "kamen" : "espreso",
      image: heroImage.src ? { ...heroImage, focal } : null,
      imageMobile: heroImageMobile.src ? { ...heroImageMobile, focal } : null,
    },
    editorial: row.editorialText
      ? { text: row.editorialText, image: toMedia(row.editorialImagePath, row.editorialImageAlt, row.name) }
      : null,
  };
}

const ROOM_SORTS: readonly RoomSort[] = ["preporuceno", "najnovije", "cena-rastuce", "cena-opadajuce"];

/** Vrednost iz URL-a (?sort=...) u poznato sortiranje; sve nepoznato je „preporučeno“. */
export function parseRoomSort(value: string | string[] | undefined): RoomSort {
  return ROOM_SORTS.find((sort) => sort === value) ?? "preporuceno";
}

const roomOrderBy = {
  // Redosled koji admin postavi u sobi (ProductCategory.position).
  preporuceno: [{ position: "asc" }],
  najnovije: [{ product: { publishedAt: { sort: "desc", nulls: "last" } } }, { position: "asc" }],
  "cena-rastuce": [{ product: { priceRsd: "asc" } }, { position: "asc" }],
  "cena-opadajuce": [{ product: { priceRsd: "desc" } }, { position: "asc" }],
} satisfies Record<RoomSort, Prisma.ProductCategoryOrderByWithRelationInput[]>;

/** Proizvodi jedne sobe, sortirani. Svako sortiranje je zaseban unos u kešu. */
export async function getRoomProducts(slug: string, sort: RoomSort): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const rows = await prisma.productCategory.findMany({
    where: { category: { slug, isVisible: true }, product: visibleProduct },
    orderBy: roomOrderBy[sort],
    select: { product: { select: productSummarySelect } },
  });

  return rows.map(({ product }) => toProductSummary(product));
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
type CampaignRow = Prisma.CampaignGetPayload<{ select: typeof campaignSelect }>;

function toCampaign(row: CampaignRow): Campaign {
  const focal = { x: row.focalX, y: row.focalY };
  const heroAlt = row.heroImageAlt ?? row.headline;
  const image = { ...toMedia(row.heroImagePath, heroAlt), focal };

  // „Slika preko“ ima smisla samo kad slika postoji; bez nje hero se vraća na boju (split).
  const layout =
    row.layout === "OVERLAY" ? (image.src ? "overlay" : "split") : row.layout === "FULL_BLEED" ? "full-bleed" : "split";

  return {
    slug: row.slug,
    season: row.season,
    headline: row.headline,
    intro: row.intro,
    cta: { label: row.ctaLabel, href: row.ctaHref },
    layout,
    theme: row.theme === "ESPRESO" ? "espreso" : "kamen",
    image,
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

/** Zakazana kampanja čiji period obuhvata dati trenutak. */
const runningAt = (now: Date) =>
  ({ status: "SCHEDULED", startsAt: { lte: now }, endsAt: { gte: now } }) satisfies Prisma.CampaignWhereInput;

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
      where: runningAt(now),
      orderBy: { startsAt: "desc" },
      select: campaignSelect,
    })) ??
    (await prisma.campaign.findFirst({
      where: { isDefault: true },
      select: campaignSelect,
    }));

  if (!row) throw new Error("Ne postoji ni aktivna ni podrazumevana kampanja. Pokrenite `npm run db:seed`.");
  return toCampaign(row);
}

/**
 * Kampanja po slugu, za stranicu kolekcije. Vidljiva je samo dok traje (ili ako je podrazumevana),
 * da buduća kolekcija ne procuri preko linka pre datuma početka.
 */
export async function getCampaign(slug: string): Promise<Campaign | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 86_400 });
  cacheTag(CACHE_TAGS.campaigns);

  const row = await prisma.campaign.findFirst({
    where: { slug, OR: [{ isDefault: true }, runningAt(new Date())] },
    select: campaignSelect,
  });

  return row ? toCampaign(row) : null;
}
// ─── Navigacija ─────────────────────────────────────────────

/**
 * Glavni meni: aktivna kampanja („Kolekcija“) pa sobe iz baze.
 * Nema sopstveni keš jer obe funkcije ispod već imaju svoj,
 * pa izmena sobe ili kampanje u adminu menja i meni.
 */
export async function getMainNav(): Promise<NavLink[]> {
  const [campaign, rooms] = await Promise.all([getActiveCampaign(), getRooms()]);

  return [
    { href: `/kolekcija/${campaign.slug}`, label: "Kolekcija", note: campaign.season },
    ...rooms.map((room) => ({
      href: `/${room.slug}`,
      label: room.name,
      note: room.description || undefined,
    })),
  ];
}

// ─── Početna ────────────────────────────────────────────────

/** Čita tekstualno polje iz podešavanja sekcije (JSON); prazno ili nepostojeće → podrazumevano. */
function text(settings: Record<string, unknown>, key: string, fallback: string): string {
  const value = settings[key];
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function toGiftsContent(settings: Record<string, unknown>): GiftsContent {
  const title = text(settings, "title", "Ritual za dvoje");
  return {
    eyebrow: text(settings, "eyebrow", "Pokloni"),
    title,
    text: text(
      settings,
      "text",
      "Dve ručno glazirane šolje i laneni peškir, spakovani u kutiju sa monogramom. Spremno za poklon.",
    ),
    cta: { label: text(settings, "ctaLabel", "Pogledaj poklone"), href: text(settings, "ctaHref", "/pokloni") },
    image: toMedia(
      text(settings, "imagePath", ""),
      text(settings, "imageAlt", "Poklon kutija sa monogramom, unutra dve šolje i složen peškir, svilena traka"),
      title,
    ),
  };
}

const INSTAGRAM_URL = "https://www.instagram.com/monahome.rs";

/** Probni kadrovi dok u adminu nisu dodate prave objave. */
const SOCIAL_PLACEHOLDERS = [
  "Šolja na prozoru, jutarnje svetlo",
  "Slaganje peškira na drvenoj stolici",
  "Pled na krevetu, nedeljno jutro",
  "Detalj glazure šolje",
  "Jutarnji ritual: kafa i lan",
  "Kupatilo u kamenu, složeni peškiri",
];

function toSocialContent(settings: Record<string, unknown>): SocialContent {
  const raw = Array.isArray(settings.posts) ? settings.posts : [];
  const posts = raw
    .filter((post): post is Record<string, unknown> => typeof post === "object" && post !== null)
    .map((post, index) => ({
      id: `post-${index}`,
      image: toMedia(text(post, "imagePath", ""), text(post, "imageAlt", "Objava sa Instagrama")),
      href: text(post, "href", INSTAGRAM_URL),
    }));

  return {
    handle: text(settings, "handle", "@monahome.rs"),
    posts:
      posts.length > 0
        ? posts.slice(0, 6)
        : SOCIAL_PLACEHOLDERS.map((alt, index) => ({
            id: `placeholder-${index}`,
            image: { src: null, alt },
            href: INSTAGRAM_URL,
          })),
  };
}

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
    const settings =
      row.settings && typeof row.settings === "object" && !Array.isArray(row.settings)
        ? (row.settings as Record<string, unknown>)
        : {};

    switch (row.type) {
      case "HERO":
        return { type: "hero" };
      case "COLLECTION_CAROUSEL":
        return { type: "collection-carousel" };
      case "ROOMS":
        return { type: "rooms" };
      case "EDITORIAL":
        return { type: "editorial" };
      case "PRODUCT_GRID":
        return { type: "product-grid", source: settings.source === "bestsellers" ? "bestsellers" : "new" };
      case "BRAND_STORY":
        return { type: "brand-story" };
      case "GIFTS":
        return { type: "gifts", content: toGiftsContent(settings) };
      case "SOCIAL":
        return { type: "social", content: toSocialContent(settings) };
      case "NEWSLETTER":
        return { type: "newsletter" };
    }
  });
}