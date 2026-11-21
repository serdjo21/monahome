"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { FormState } from "@/lib/auth-forms";
import { belgradeEndOfDay, belgradeStartOfDay } from "@/lib/dates";
import { slugify } from "@/lib/slug";
import { findOverlapping, getShownCampaignId } from "@/server/admin/campaigns";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { copyObject, objectExists, removeObjects } from "@/server/storage";
import { CACHE_TAGS } from "@/server/storefront";
import { mediaUrl } from "@/server/storefront/media";

type Result = { ok: boolean; error?: string };

/** Kampanja je na početnoj, u meniju („Kolekcija“) i na stranici kolekcije. */
function refresh() {
  revalidateTag(CACHE_TAGS.campaigns, "max");
  revalidateTag(CACHE_TAGS.home, "max");
  revalidatePath("/admin/kampanje", "layout");
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function issuesToFieldErrors(issues: z.core.$ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return fieldErrors;
}

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, { error: `Unesite ${label.toLowerCase()}.` })
    .max(max, { error: `${label} može imati najviše ${max} znakova.` });

const optional = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} može imati najviše ${max} znakova.` })
    .transform((value) => value || null);

async function resolveSlug(raw: string, name: string, campaignId: string | null) {
  const slug = slugify(raw || name);
  if (!slug) return { slug, error: "Link mora sadržati bar jedno slovo ili cifru." };
  const taken = await prisma.campaign.findFirst({
    where: { slug, ...(campaignId ? { id: { not: campaignId } } : {}) },
    select: { id: true },
  });
  return taken ? { slug, error: "Ovaj link već koristi druga kampanja." } : { slug };
}

// ─── Nova, izmena ───────────────────────────────────────────

const createSchema = z.object({
  name: text(2, 80, "Naziv"),
  slug: z.string().trim().max(80, { error: "Link je predugačak." }),
});

/** Nova kampanja kao nacrt, sa osnovnim tekstovima koji se odmah mogu menjati. */
export async function createCampaign(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/kampanje");

  const values = { name: field(formData, "name"), slug: field(formData, "slug") };
  const parsed = createSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: issuesToFieldErrors(parsed.error.issues), values };

  const { slug, error } = await resolveSlug(parsed.data.slug, parsed.data.name, null);
  if (error) return { fieldErrors: { slug: error }, values };

  const campaign = await prisma.campaign.create({
    data: {
      name: parsed.data.name,
      slug,
      status: "DRAFT",
      season: parsed.data.name,
      headline: parsed.data.name,
      intro: "",
      ctaLabel: "Pogledaj kolekciju",
      ctaHref: `/kolekcija/${slug}`,
    },
    select: { id: true },
  });

  refresh();
  redirect(`/admin/kampanje/${campaign.id}`);
}

const campaignSchema = z.object({
  name: text(2, 80, "Naziv"),
  slug: z.string().trim().max(80, { error: "Link je predugačak." }),
  status: z.enum(["DRAFT", "SCHEDULED", "ARCHIVED"]),
  startsAt: z.string().trim(),
  endsAt: z.string().trim(),
  season: text(2, 40, "Sezona"),
  headline: text(2, 90, "Naslov"),
  intro: z.string().trim().max(240, { error: "Uvod može imati najviše 240 znakova." }),
  ctaLabel: text(2, 40, "Tekst dugmeta"),
  ctaHref: z
    .string()
    .trim()
    .max(300, { error: "Link je predugačak." })
    .regex(/^(\/[^\s]*|https:\/\/[^\s]+)$/, { error: "Link mora početi sa „/“ (stranica sajta) ili „https://“." }),
  layout: z.enum(["SPLIT", "FULL_BLEED", "OVERLAY"]),
  theme: z.enum(["ESPRESO", "KAMEN"]),
  heroImageAlt: optional(200, "Opis fotografije"),
  focalX: z.coerce.number().int().min(0).max(100),
  focalY: z.coerce.number().int().min(0).max(100),
  editorialTitle: optional(90, "Naslov editorijala"),
  editorialText: optional(500, "Tekst editorijala"),
  editorialImageAlt: optional(200, "Opis fotografije"),
});

/** Svi tekstovi i podešavanja kampanje. Fotografije i proizvodi se čuvaju odmah, posebnim akcijama. */
export async function saveCampaign(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/kampanje");

  const campaignId = field(formData, "campaignId");
  const names = [
    "name",
    "slug",
    "status",
    "startsAt",
    "endsAt",
    "season",
    "headline",
    "intro",
    "ctaLabel",
    "ctaHref",
    "layout",
    "theme",
    "heroImageAlt",
    "focalX",
    "focalY",
    "editorialTitle",
    "editorialText",
    "editorialImageAlt",
  ] as const;
  const values = Object.fromEntries(names.map((name) => [name, field(formData, name)])) as Record<
    (typeof names)[number],
    string
  >;
  values.focalX ||= "50";
  values.focalY ||= "50";
  const isDefault = formData.get("isDefault") === "on";

  const parsed = campaignSchema.safeParse(values);
  const fieldErrors = parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);

  const startsAt = values.startsAt ? belgradeStartOfDay(values.startsAt) : null;
  const endsAt = values.endsAt ? belgradeEndOfDay(values.endsAt) : null;
  if (values.startsAt && !startsAt) fieldErrors.startsAt = "Neispravan datum.";
  if (values.endsAt && !endsAt) fieldErrors.endsAt = "Neispravan datum.";
  if (startsAt && endsAt && endsAt < startsAt) fieldErrors.endsAt = "Kraj ne može biti pre početka.";
  if (parsed.success && parsed.data.status === "SCHEDULED") {
    if (!values.startsAt) fieldErrors.startsAt = "Zakazana kampanja mora imati početak.";
    if (!values.endsAt) fieldErrors.endsAt = "Zakazana kampanja mora imati kraj.";
  }
  if (parsed.success && Boolean(parsed.data.editorialTitle) !== Boolean(parsed.data.editorialText)) {
    fieldErrors[parsed.data.editorialTitle ? "editorialText" : "editorialTitle"] =
      "Editorijal se prikazuje samo kad postoje i naslov i tekst.";
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const current = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { isDefault: true } });
  if (!current) return { error: "Kampanja više ne postoji." };
  if (current.isDefault && !isDefault) {
    return {
      error: "Uvek mora postojati rezervna kampanja. Označite drugu kao rezervnu, pa će ova prestati to da bude.",
    };
  }
  if (isDefault && parsed.data.status === "ARCHIVED") {
    return { fieldErrors: { status: "Rezervna kampanja ne može biti arhivirana." }, values };
  }

  const { slug, error } = await resolveSlug(parsed.data.slug, parsed.data.name, campaignId);
  if (error) return { fieldErrors: { slug: error }, values };

  const data = { ...parsed.data, slug, startsAt, endsAt, isDefault };
  try {
    await prisma.$transaction([
      ...(isDefault && !current.isDefault
        ? [prisma.campaign.updateMany({ where: { isDefault: true }, data: { isDefault: false } })]
        : []),
      prisma.campaign.update({ where: { id: campaignId }, data }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { slug: "Ovaj link već koristi druga kampanja." }, values };
    }
    throw error;
  }

  refresh();

  if (data.status === "SCHEDULED" && startsAt && endsAt) {
    const overlapping = await findOverlapping(campaignId, startsAt, endsAt);
    if (overlapping.length > 0) {
      return {
        message: `Sačuvano. Pažnja: period se preklapa sa: ${overlapping.map((c) => c.name).join(", ")}. Prikazuje se ona koja je kasnije počela.`,
      };
    }
  }
  return { message: "Izmene su sačuvane." };
}

// ─── Fotografije ────────────────────────────────────────────

const IMAGE_SLOTS = ["heroImagePath", "heroImageMobilePath", "editorialImagePath"] as const;
type ImageSlot = (typeof IMAGE_SLOTS)[number];

/** Postavlja ili uklanja jednu fotografiju kampanje; stari fajl se briše iz Storage-a. */
export async function setCampaignImage(campaignId: string, slot: ImageSlot, path: string | null): Promise<Result> {
  await requireRole("ADMIN", "/admin/kampanje");
  if (!IMAGE_SLOTS.includes(slot)) return { ok: false, error: "Neispravan zahtev." };
  if (path !== null) {
    if (!/^kampanje\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)) return { ok: false, error: "Neispravan zahtev." };
    if (!(await objectExists(path))) {
      return { ok: false, error: "Fotografija nije stigla do servera. Pokušajte ponovo." };
    }
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { heroImagePath: true, heroImageMobilePath: true, editorialImagePath: true },
  });
  if (!campaign) {
    if (path) after(() => removeObjects([path]));
    return { ok: false, error: "Kampanja više ne postoji." };
  }

  const previous = campaign[slot];
  await prisma.campaign.update({ where: { id: campaignId }, data: { [slot]: path } });
  if (previous && previous !== path) after(() => removeObjects([previous]));

  refresh();
  return { ok: true };
}

// ─── Proizvodi u kampanji ───────────────────────────────────

export type ProductOption = { id: string; name: string; status: string; priceRsd: number; src: string | null };

/** Pretraga proizvoda koji još nisu u kampanji (bez arhiviranih). */
export async function searchCampaignProducts(campaignId: string, query: string): Promise<ProductOption[]> {
  await requireRole("ADMIN", "/admin/kampanje");
  const q = query.trim().slice(0, 100);

  const rows = await prisma.product.findMany({
    where: {
      status: { not: "ARCHIVED" },
      campaigns: { none: { campaignId } },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 8,
    select: {
      id: true,
      name: true,
      status: true,
      priceRsd: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { path: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    priceRsd: row.priceRsd,
    src: mediaUrl(row.images[0]?.path),
  }));
}

export async function addCampaignProduct(campaignId: string, productId: string): Promise<Result> {
  await requireRole("ADMIN", "/admin/kampanje");
  const last = await prisma.campaignProduct.aggregate({ where: { campaignId }, _max: { position: true } });
  try {
    await prisma.campaignProduct.create({
      data: { campaignId, productId, position: (last._max.position ?? -1) + 1 },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: true };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, error: "Proizvod ili kampanja više ne postoji." };
    }
    throw error;
  }
  refresh();
  return { ok: true };
}

export async function removeCampaignProduct(campaignId: string, productId: string): Promise<Result> {
  await requireRole("ADMIN", "/admin/kampanje");
  await prisma.campaignProduct.deleteMany({ where: { campaignId, productId } });
  refresh();
  return { ok: true };
}

export async function moveCampaignProduct(campaignId: string, productId: string, direction: -1 | 1): Promise<Result> {
  await requireRole("ADMIN", "/admin/kampanje");

  const items = await prisma.campaignProduct.findMany({
    where: { campaignId },
    orderBy: [{ position: "asc" }, { productId: "asc" }],
    select: { productId: true },
  });
  const from = items.findIndex((item) => item.productId === productId);
  const to = from + (direction === 1 ? 1 : -1);
  if (from < 0 || to < 0 || to >= items.length) return { ok: true };

  [items[from], items[to]] = [items[to], items[from]];
  await prisma.$transaction(
    items.map((item, index) =>
      prisma.campaignProduct.update({
        where: { campaignId_productId: { campaignId, productId: item.productId } },
        data: { position: index },
      }),
    ),
  );
  refresh();
  return { ok: true };
}

// ─── Dupliranje, brisanje ───────────────────────────────────

/** Kopija za sledeću sezonu: svi tekstovi, proizvodi i (kopirane) fotografije, kao nacrt bez perioda. */
export async function duplicateCampaign(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "/admin/kampanje");

  const source = await prisma.campaign.findUnique({
    where: { id: field(formData, "campaignId") },
    include: { products: { select: { productId: true, position: true } } },
  });
  if (!source) redirect("/admin/kampanje");

  let slug = `${source.slug}-kopija`.slice(0, 80);
  for (let n = 2; await prisma.campaign.findFirst({ where: { slug }, select: { id: true } }); n++) {
    slug = `${source.slug}-kopija-${n}`.slice(0, 80);
  }

  // Svaka kampanja ima svoje fajlove, da brisanje jedne ne obriše fotografiju drugoj.
  async function copy(path: string | null) {
    if (!path || path.startsWith("/")) return path;
    const target = `kampanje/${randomUUID()}.${path.split(".").pop()}`;
    return (await copyObject(path, target)) ? target : null;
  }
  const [heroImagePath, heroImageMobilePath, editorialImagePath] = await Promise.all([
    copy(source.heroImagePath),
    copy(source.heroImageMobilePath),
    copy(source.editorialImagePath),
  ]);

  const copyCampaign = await prisma.campaign.create({
    data: {
      name: `${source.name} (kopija)`.slice(0, 80),
      slug,
      status: "DRAFT",
      isDefault: false,
      season: source.season,
      headline: source.headline,
      intro: source.intro,
      ctaLabel: source.ctaLabel,
      ctaHref: source.ctaHref === `/kolekcija/${source.slug}` ? `/kolekcija/${slug}` : source.ctaHref,
      layout: source.layout,
      theme: source.theme,
      heroImagePath,
      heroImageMobilePath,
      heroImageAlt: source.heroImageAlt,
      focalX: source.focalX,
      focalY: source.focalY,
      editorialTitle: source.editorialTitle,
      editorialText: source.editorialText,
      editorialImagePath,
      editorialImageAlt: source.editorialImageAlt,
      products: { create: source.products.map(({ productId, position }) => ({ productId, position })) },
    },
    select: { id: true },
  });

  refresh();
  redirect(`/admin/kampanje/${copyCampaign.id}`);
}

/** Brisanje. Rezervna i kampanja koja se upravo prikazuje ne mogu se obrisati. */
export async function deleteCampaign(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/kampanje");
  const campaignId = field(formData, "campaignId");

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { isDefault: true, heroImagePath: true, heroImageMobilePath: true, editorialImagePath: true },
  });
  if (!campaign) return { error: "Kampanja više ne postoji." };
  if (campaign.isDefault) return { error: "Rezervna kampanja se ne može obrisati." };
  if ((await getShownCampaignId(new Date())) === campaignId) {
    return { error: "Ova kampanja se upravo prikazuje na sajtu. Promenite joj status ili period, pa je obrišite." };
  }

  await prisma.campaign.delete({ where: { id: campaignId } });
  const files = [campaign.heroImagePath, campaign.heroImageMobilePath, campaign.editorialImagePath];
  after(() => removeObjects(files.filter((path): path is string => Boolean(path))));

  refresh();
  redirect("/admin/kampanje");
}