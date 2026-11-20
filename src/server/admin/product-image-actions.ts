"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { MAX_PRODUCT_IMAGES, PRODUCT_IMAGE_SPEC, PRODUCT_IMAGE_TYPES } from "@/lib/product-admin";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { createSignedUploadUrl, objectExists, removeObjects } from "@/server/storage";
import { CACHE_TAGS } from "@/server/storefront";

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const EXTENSION: Record<(typeof PRODUCT_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function refresh(productId: string) {
  revalidateTag(CACHE_TAGS.products, "max");
  revalidateTag(CACHE_TAGS.campaigns, "max");
  revalidateTag(CACHE_TAGS.home, "max");
  revalidatePath(`/admin/proizvodi/${productId}`);
  revalidatePath("/admin/proizvodi");
}

/** Putanja u Storage-u koju je napravio server za baš ovaj proizvod (ne prihvata tuđe ili izmišljene). */
const ownPath = (productId: string, path: string) =>
  new RegExp(`^proizvodi/${productId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(path);

const filesSchema = z
  .array(
    z.object({
      type: z.enum(PRODUCT_IMAGE_TYPES, { error: "Dozvoljeni su samo JPG, PNG i WebP." }),
      size: z
        .number()
        .int()
        .positive()
        .max(PRODUCT_IMAGE_SPEC.maxMb * 1024 * 1024, {
          error: `Fotografija može imati najviše ${PRODUCT_IMAGE_SPEC.maxMb} MB.`,
        }),
    }),
  )
  .min(1)
  .max(MAX_PRODUCT_IMAGES);

/** Korak 1: potpisani linkovi za upload. Fajlovi idu iz browsera pravo u Storage. */
export async function createImageUploads(
  productId: string,
  files: { type: string; size: number }[],
): Promise<Result<{ path: string; uploadUrl: string }[]>> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const parsed = filesSchema.safeParse(files);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravni fajlovi." };

  const count = await prisma.productImage.count({ where: { productId } });
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { ok: false, error: "Proizvod više ne postoji." };
  if (count + parsed.data.length > MAX_PRODUCT_IMAGES) {
    return { ok: false, error: `Proizvod može imati najviše ${MAX_PRODUCT_IMAGES} fotografija.` };
  }

  try {
    const uploads = await Promise.all(
      parsed.data.map(async (file) => {
        const path = `proizvodi/${productId}/${randomUUID()}.${EXTENSION[file.type]}`;
        return { path, uploadUrl: await createSignedUploadUrl(path) };
      }),
    );
    return { ok: true, data: uploads };
  } catch {
    return { ok: false, error: "Upload trenutno nije moguć. Proverite podešavanja Storage-a." };
  }
}

/** Korak 2: posle uspešnog uploada fotografije se upisuju u bazu, na kraj galerije. */
export async function attachProductImages(productId: string, paths: string[]): Promise<Result> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const unique = [...new Set(paths)].slice(0, MAX_PRODUCT_IMAGES);
  if (unique.length === 0 || !unique.every((path) => ownPath(productId, path))) {
    return { ok: false, error: "Neispravan zahtev." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, images: { select: { path: true, position: true } } },
  });
  if (!product) {
    after(() => removeObjects(unique));
    return { ok: false, error: "Proizvod više ne postoji." };
  }

  const known = new Set(product.images.map((image) => image.path));
  const checked = await Promise.all(
    unique.filter((path) => !known.has(path)).map(async (path) => ((await objectExists(path)) ? path : null)),
  );
  const uploaded = checked.filter((path): path is string => path !== null);
  if (uploaded.length === 0) return { ok: false, error: "Fotografije nisu stigle do servera. Pokušajte ponovo." };

  let position = product.images.reduce((max, image) => Math.max(max, image.position), -1);
  await prisma.productImage.createMany({
    data: uploaded.map((path) => ({ productId, path, alt: product.name, position: ++position })),
  });

  refresh(productId);
  return { ok: true, data: undefined };
}

const updateSchema = z.object({
  imageId: z.string().min(1).max(64),
  alt: z.string().trim().min(1, { error: "Opis fotografije je obavezan." }).max(200, { error: "Opis je predugačak." }),
  variantId: z
    .string()
    .max(64)
    .transform((value) => value || null),
});

/** Opis (alt) i boja na koju se fotografija odnosi. */
export async function updateProductImage(input: { imageId: string; alt: string; variantId: string }): Promise<Result> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravan zahtev." };
  const { imageId, alt, variantId } = parsed.data;

  const image = await prisma.productImage.findUnique({ where: { id: imageId }, select: { productId: true } });
  if (!image) return { ok: false, error: "Fotografija više ne postoji." };
  if (variantId) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId: image.productId } });
    if (!variant) return { ok: false, error: "Izabrana boja više ne postoji." };
  }

  await prisma.productImage.update({ where: { id: imageId }, data: { alt, variantId } });
  refresh(image.productId);
  return { ok: true, data: undefined };
}

/** Pomeranje levo/desno. Prva fotografija je glavna (kartica proizvoda), druga se vidi na prelaz mišem. */
export async function moveProductImage(imageId: string, direction: -1 | 1): Promise<Result> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const image = await prisma.productImage.findUnique({ where: { id: imageId }, select: { productId: true } });
  if (!image) return { ok: false, error: "Fotografija više ne postoji." };

  const images = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const from = images.findIndex((item) => item.id === imageId);
  const to = from + (direction === 1 ? 1 : -1);
  if (to < 0 || to >= images.length) return { ok: true, data: undefined };

  [images[from], images[to]] = [images[to], images[from]];
  await prisma.$transaction(
    images.map((item, index) => prisma.productImage.update({ where: { id: item.id }, data: { position: index } })),
  );

  refresh(image.productId);
  return { ok: true, data: undefined };
}

/** Brisanje iz galerije i iz Storage-a. */
export async function deleteProductImage(imageId: string): Promise<Result> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true, path: true },
  });
  if (!image) return { ok: false, error: "Fotografija više ne postoji." };

  await prisma.productImage.delete({ where: { id: imageId } });
  after(() => removeObjects([image.path]));

  refresh(image.productId);
  return { ok: true, data: undefined };
}