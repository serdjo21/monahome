"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import type { HomeSectionType } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/auth-forms";
import { readBrandStory, readGifts, readSocial, SOCIAL_POST_SLOTS } from "@/lib/home-content";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { objectExists, removeObjects } from "@/server/storage";
import { CACHE_TAGS } from "@/server/storefront";

function refresh() {
  revalidateTag(CACHE_TAGS.home, "max");
  revalidatePath("/admin/pocetna");
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function currentSettings(type: HomeSectionType) {
  const row = await prisma.homeSection.findUnique({ where: { type }, select: { settings: true } });
  return asObject(row?.settings);
}

const typeSchema = z.enum([
  "COLLECTION_CAROUSEL",
  "ROOMS",
  "EDITORIAL",
  "PRODUCT_GRID",
  "BRAND_STORY",
  "GIFTS",
  "SOCIAL",
  "NEWSLETTER",
]);

// ─── Redosled i uključivanje ────────────────────────────────

/** Pomeranje gore/dole. Hero se ne pomera: uvek je prvi. */
export async function moveHomeSection(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "/admin/pocetna");
  const type = typeSchema.safeParse(field(formData, "type"));
  if (!type.success) return;
  const direction = field(formData, "direction") === "down" ? 1 : -1;

  const rows = await prisma.homeSection.findMany({ orderBy: { position: "asc" }, select: { type: true } });
  const others = rows.filter((row) => row.type !== "HERO").map((row) => row.type);
  const from = others.indexOf(type.data);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= others.length) return;

  [others[from], others[to]] = [others[to], others[from]];
  const order: HomeSectionType[] = ["HERO", ...others];
  await prisma.$transaction(
    order.map((sectionType, position) =>
      prisma.homeSection.update({ where: { type: sectionType }, data: { position } }),
    ),
  );
  refresh();
}

/** Uključi/isključi sekciju. Hero je uvek uključen. */
export async function toggleHomeSection(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "/admin/pocetna");
  const type = typeSchema.safeParse(field(formData, "type"));
  if (!type.success) return;

  const row = await prisma.homeSection.findUnique({ where: { type: type.data }, select: { isEnabled: true } });
  if (!row) return;
  await prisma.homeSection.update({ where: { type: type.data }, data: { isEnabled: !row.isEnabled } });
  refresh();
}

// ─── Tekstovi ───────────────────────────────────────────────

const t = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Najviše ${max} znakova.` });
const href = z
  .string()
  .trim()
  .max(300, { error: "Link je predugačak." })
  .regex(/^$|^(\/[^\s]*|https:\/\/[^\s]+)$/, { error: "Link mora početi sa „/“ ili „https://“." });

const schemas = {
  PRODUCT_GRID: z.object({
    source: z.enum(["new", "bestsellers"]),
    eyebrow: t(40),
    title: t(80),
    linkLabel: t(40),
    linkHref: href,
  }),
  BRAND_STORY: z.object({
    eyebrow: t(40),
    title: t(120),
    principle0Title: t(40),
    principle0Text: t(200),
    principle1Title: t(40),
    principle1Text: t(200),
    principle2Title: t(40),
    principle2Text: t(200),
    linkLabel: t(40),
    linkHref: href,
    imageAlt: t(200),
  }),
  GIFTS: z.object({
    eyebrow: t(40),
    title: t(80),
    text: t(400),
    ctaLabel: t(40),
    ctaHref: href,
    imageAlt: t(200),
  }),
  SOCIAL: z.object({
    handle: t(40),
    ...Object.fromEntries(
      Array.from({ length: SOCIAL_POST_SLOTS }, (_, i) => [
        [`post${i}Href`, href],
        [`post${i}Alt`, t(200)],
      ]).flat(),
    ),
  }),
  NEWSLETTER: z.object({ eyebrow: t(40), title: t(120), note: t(160) }),
} as const;

type EditableType = keyof typeof schemas;

/** Tekstovi jedne sekcije. Fotografije ostaju kakve jesu (čuvaju se odmah, posebnom akcijom). */
export async function saveHomeSection(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/pocetna");

  const type = field(formData, "type") as EditableType;
  const schema = schemas[type];
  if (!schema) return { error: "Neispravan zahtev." };

  const values = Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]));
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values };
  }
  const data = parsed.data as Record<string, string>;
  const current = await currentSettings(type);

  let settings: Record<string, unknown>;
  switch (type) {
    case "BRAND_STORY":
      settings = {
        ...current,
        eyebrow: data.eyebrow,
        title: data.title,
        principles: [0, 1, 2].map((i) => ({ title: data[`principle${i}Title`], text: data[`principle${i}Text`] })),
        linkLabel: data.linkLabel,
        linkHref: data.linkHref,
        imageAlt: data.imageAlt,
      };
      break;
    case "SOCIAL": {
      const posts = readSocial(current).posts.map((post, i) => ({
        imagePath: post.imagePath,
        imageAlt: data[`post${i}Alt`],
        href: data[`post${i}Href`],
      }));
      settings = { ...current, handle: data.handle, posts };
      break;
    }
    default:
      settings = { ...current, ...data };
  }
  delete settings.type;

  await prisma.homeSection.update({ where: { type }, data: { settings: settings as Prisma.InputJsonObject } });
  refresh();
  return { message: "Sačuvano." };
}

// ─── Fotografije ────────────────────────────────────────────

type ImageTarget = "BRAND_STORY" | "GIFTS" | `SOCIAL_${number}`;

/** Postavlja ili uklanja fotografiju sekcije (za Mreže: jednu od 6 objava); stari fajl se briše. */
export async function setHomeImage(target: ImageTarget, path: string | null): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN", "/admin/pocetna");

  const social = /^SOCIAL_(\d)$/.exec(target);
  const slot = social ? Number(social[1]) : null;
  if (!(target === "BRAND_STORY" || target === "GIFTS" || (slot !== null && slot < SOCIAL_POST_SLOTS))) {
    return { ok: false, error: "Neispravan zahtev." };
  }
  if (path !== null) {
    if (!/^pocetna\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)) return { ok: false, error: "Neispravan zahtev." };
    if (!(await objectExists(path)))
      return { ok: false, error: "Fotografija nije stigla do servera. Pokušajte ponovo." };
  }

  const type: HomeSectionType = slot !== null ? "SOCIAL" : (target as "BRAND_STORY" | "GIFTS");
  const current = await currentSettings(type);
  let previous: string;
  let settings: Record<string, unknown>;

  if (slot !== null) {
    const posts = readSocial(current).posts;
    previous = posts[slot].imagePath;
    posts[slot] = { ...posts[slot], imagePath: path ?? "" };
    settings = { ...current, posts };
  } else {
    previous = (type === "GIFTS" ? readGifts(current) : readBrandStory(current)).imagePath;
    settings = { ...current, imagePath: path ?? "" };
  }

  await prisma.homeSection.update({ where: { type }, data: { settings: settings as Prisma.InputJsonObject } });
  if (previous && previous !== path) after(() => removeObjects([previous]));

  refresh();
  return { ok: true };
}