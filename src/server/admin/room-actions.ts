"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { FormState } from "@/lib/auth-forms";
import { RESERVED_SLUGS } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { objectExists, removeObjects } from "@/server/storage";
import { CACHE_TAGS } from "@/server/storefront";

/** Sobe su u meniju, futeru, na početnoj i na svojim stranicama: osvežava se sve. */
function refresh() {
  revalidateTag(CACHE_TAGS.categories, "max");
  revalidateTag(CACHE_TAGS.products, "max");
  revalidateTag(CACHE_TAGS.home, "max");
  revalidatePath("/admin/sobe", "layout");
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

const optional = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} može imati najviše ${max} znakova.` })
    .transform((value) => value || null);

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Unesite naziv sobe." })
    .max(60, { error: "Naziv može imati najviše 60 znakova." }),
  slug: z.string().trim().max(60, { error: "Link je predugačak." }),
  description: optional(160, "Opis"),
});

/** Link sobe: iz unosa ili naziva, ne sme biti zauzet ni rezervisan za druge stranice sajta. */
async function resolveSlug(
  raw: string,
  name: string,
  roomId: string | null,
): Promise<{ slug: string; error?: string }> {
  const slug = slugify(raw || name);
  if (!slug) return { slug, error: "Link mora sadržati bar jedno slovo ili cifru." };
  if (RESERVED_SLUGS.has(slug)) return { slug, error: "Ovaj link koristi druga stranica sajta. Izaberite drugi." };
  const taken = await prisma.category.findFirst({
    where: { slug, ...(roomId ? { id: { not: roomId } } : {}) },
    select: { id: true },
  });
  if (taken) return { slug, error: "Ovaj link već koristi druga soba." };
  return { slug };
}

function issuesToFieldErrors(issues: z.core.$ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return fieldErrors;
}

/** Nova soba: pravi se skrivena, na kraju menija, pa se otvara njena stranica za slike i hero. */
export async function createRoom(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/sobe");

  const values = {
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
  };
  const parsed = baseSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: issuesToFieldErrors(parsed.error.issues), values };

  const { slug, error } = await resolveSlug(parsed.data.slug, parsed.data.name, null);
  if (error) return { fieldErrors: { slug: error }, values };

  const last = await prisma.category.aggregate({ _max: { position: true } });
  let id: string;
  try {
    const room = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        isVisible: false,
        position: (last._max.position ?? -1) + 1,
      },
      select: { id: true },
    });
    id = room.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { slug: "Ovaj link već koristi druga soba." }, values };
    }
    throw error;
  }

  refresh();
  redirect(`/admin/sobe/${id}`);
}

const roomSchema = baseSchema.extend({
  imageAlt: optional(200, "Opis fotografije"),
  heroTheme: z.enum(["ESPRESO", "KAMEN"]),
  heroImageAlt: optional(200, "Opis fotografije"),
  heroFocalX: z.coerce.number().int().min(0).max(100),
  heroFocalY: z.coerce.number().int().min(0).max(100),
  editorialText: optional(240, "Tekst editorijala"),
  editorialImageAlt: optional(200, "Opis fotografije"),
});

/** Svi tekstovi sobe (fotografije se čuvaju odmah, posebnom akcijom). */
export async function saveRoom(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/sobe");

  const roomId = field(formData, "roomId");
  const values = {
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
    imageAlt: field(formData, "imageAlt"),
    heroTheme: field(formData, "heroTheme"),
    heroImageAlt: field(formData, "heroImageAlt"),
    heroFocalX: field(formData, "heroFocalX") || "50",
    heroFocalY: field(formData, "heroFocalY") || "50",
    editorialText: field(formData, "editorialText"),
    editorialImageAlt: field(formData, "editorialImageAlt"),
  };
  const isVisible = formData.get("isVisible") === "on";

  const parsed = roomSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: issuesToFieldErrors(parsed.error.issues), values };

  const { slug, error } = await resolveSlug(parsed.data.slug, parsed.data.name, roomId);
  if (error) return { fieldErrors: { slug: error }, values };

  try {
    await prisma.category.update({ where: { id: roomId }, data: { ...parsed.data, slug, isVisible } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { slug: "Ovaj link već koristi druga soba." }, values };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "Soba više ne postoji." };
    }
    throw error;
  }

  refresh();
  return { message: isVisible ? "Izmene su sačuvane i vide se na sajtu." : "Izmene su sačuvane. Soba je skrivena." };
}

const IMAGE_SLOTS = ["imagePath", "heroImagePath", "heroImageMobilePath", "editorialImagePath"] as const;
type ImageSlot = (typeof IMAGE_SLOTS)[number];

/** Postavlja ili uklanja jednu fotografiju sobe; stari fajl se briše iz Storage-a. */
export async function setRoomImage(
  roomId: string,
  slot: ImageSlot,
  path: string | null,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN", "/admin/sobe");
  if (!IMAGE_SLOTS.includes(slot)) return { ok: false, error: "Neispravan zahtev." };
  if (path !== null) {
    if (!/^sobe\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)) return { ok: false, error: "Neispravan zahtev." };
    if (!(await objectExists(path)))
      return { ok: false, error: "Fotografija nije stigla do servera. Pokušajte ponovo." };
  }

  const room = await prisma.category.findUnique({
    where: { id: roomId },
    select: { imagePath: true, heroImagePath: true, heroImageMobilePath: true, editorialImagePath: true },
  });
  if (!room) {
    if (path) after(() => removeObjects([path]));
    return { ok: false, error: "Soba više ne postoji." };
  }

  const previous = room[slot];
  await prisma.category.update({ where: { id: roomId }, data: { [slot]: path } });
  if (previous && previous !== path) after(() => removeObjects([previous]));

  refresh();
  return { ok: true };
}

/** Pomeranje gore/dole u meniju. */
export async function moveRoom(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "/admin/sobe");
  const roomId = field(formData, "roomId");
  const direction = field(formData, "direction") === "down" ? 1 : -1;

  const rooms = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const from = rooms.findIndex((room) => room.id === roomId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= rooms.length) return;

  [rooms[from], rooms[to]] = [rooms[to], rooms[from]];
  await prisma.$transaction(
    rooms.map((room, index) => prisma.category.update({ where: { id: room.id }, data: { position: index } })),
  );
  refresh();
}

/** Brisanje samo prazne sobe; sa proizvodima se predlaže sakrivanje (proizvodi se nikad ne brišu sa sobom). */
export async function deleteRoom(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/sobe");
  const roomId = field(formData, "roomId");

  const room = await prisma.category.findUnique({
    where: { id: roomId },
    select: {
      imagePath: true,
      heroImagePath: true,
      heroImageMobilePath: true,
      editorialImagePath: true,
      _count: { select: { products: true } },
    },
  });
  if (!room) return { error: "Soba više ne postoji." };
  if (room._count.products > 0) {
    return { error: "U sobi ima proizvoda. Uklonite ih iz sobe ili je samo sakrijte." };
  }

  await prisma.category.delete({ where: { id: roomId } });
  const files = [room.imagePath, room.heroImagePath, room.heroImageMobilePath, room.editorialImagePath];
  after(() => removeObjects(files.filter((path): path is string => Boolean(path))));

  refresh();
  redirect("/admin/sobe");
}