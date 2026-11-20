"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { FormState } from "@/lib/auth-forms";
import { slugify } from "@/lib/slug";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { removeObjects } from "@/server/storage";
import { CACHE_TAGS } from "@/server/storefront";

const MAX_PRICE = 10_000_000;
const MAX_STOCK = 100_000;

// ─── Pomoćno ────────────────────────────────────────────────

/** Proizvod se pojavljuje na stranicama soba, kolekcija i početnoj: sve se osvežava odjednom. */
function refreshStorefront() {
  for (const tag of Object.values(CACHE_TAGS)) revalidateTag(tag, "max");
  revalidatePath("/admin/proizvodi", "layout");
}

const text = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} može imati najviše ${max.toLocaleString("sr-Latn-RS")} znakova.` })
    .transform((value) => value || null);

/** „8.900“, „8 900“ ili „8900 RSD“ → 8900. Prazno polje je null (ili greška kad je obavezno). */
function readPrice(raw: string, required: boolean): { value: number | null; error?: string } {
  const cleaned = raw.replace(/[\s.]/g, "").replace(/(rsd|din)$/i, "");
  if (!cleaned) return required ? { value: null, error: "Unesite cenu." } : { value: null };
  if (!/^\d+$/.test(cleaned)) return { value: null, error: "Unesite cenu u dinarima, samo cifre (npr. 8900)." };
  const value = Number(cleaned);
  if (value < 1 || value > MAX_PRICE) return { value: null, error: "Cena nije u dozvoljenom opsegu." };
  return { value };
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function issuesToFieldErrors(issues: z.core.$ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return fieldErrors;
}

/** Objavljen proizvod mora imati bar jednu aktivnu varijantu, inače kupac nema šta da izabere. */
async function wouldLeaveActiveProductEmpty(productId: string, variantId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { status: true } });
  if (product?.status !== "ACTIVE") return false;
  const others = await prisma.productVariant.count({ where: { productId, isActive: true, id: { not: variantId } } });
  return others === 0;
}

// ─── Proizvod ───────────────────────────────────────────────

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Unesite naziv proizvoda." })
    .max(120, { error: "Naziv može imati najviše 120 znakova." }),
  slug: z.string().trim().max(120, { error: "Link je predugačak." }),
  subtitle: text(120, "Podnaslov"),
  description: text(5000, "Opis"),
  care: text(3000, "Sastav i nega"),
});

/**
 * Novi proizvod ili izmena postojećeg. Novi se pravi kao nacrt (ne vidi se na sajtu)
 * i otvara se njegova stranica, gde se dodaju varijante pa objavljuje.
 */
export async function saveProduct(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const productId = field(formData, "productId") || null;
  const values = {
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    subtitle: field(formData, "subtitle"),
    description: field(formData, "description"),
    care: field(formData, "care"),
    priceRsd: field(formData, "priceRsd"),
    compareAtRsd: field(formData, "compareAtRsd"),
  };
  const isNew = formData.get("isNew") === "on";
  const roomIds = [...new Set(formData.getAll("roomIds").map(String).filter(Boolean))];

  const parsed = productSchema.safeParse(values);
  const fieldErrors = parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);

  const price = readPrice(values.priceRsd, true);
  if (price.error) fieldErrors.priceRsd = price.error;
  const compareAt = readPrice(values.compareAtRsd, false);
  if (compareAt.error) fieldErrors.compareAtRsd = compareAt.error;
  else if (compareAt.value !== null && price.value !== null && compareAt.value <= price.value) {
    fieldErrors.compareAtRsd = "Stara cena mora biti veća od trenutne.";
  }

  const slug = parsed.success ? slugify(parsed.data.slug || parsed.data.name) : "";
  if (parsed.success && !slug) fieldErrors.slug = "Link mora sadržati bar jedno slovo ili cifru.";

  if (roomIds.length > 0) {
    const found = await prisma.category.count({ where: { id: { in: roomIds } } });
    if (found !== roomIds.length) fieldErrors.roomIds = "Izabrana soba više ne postoji. Osvežite stranicu.";
  }

  if (!parsed.success || Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const taken = await prisma.product.findFirst({
    where: { slug, ...(productId ? { id: { not: productId } } : {}) },
    select: { id: true },
  });
  if (taken) return { fieldErrors: { slug: "Ovaj link već koristi drugi proizvod." }, values };

  const data = {
    name: parsed.data.name,
    slug,
    subtitle: parsed.data.subtitle,
    description: parsed.data.description,
    care: parsed.data.care,
    priceRsd: price.value!,
    compareAtRsd: compareAt.value,
    isNew,
  };

  let createdId: string | null = null;
  try {
    if (productId) {
      await prisma.$transaction([
        prisma.product.update({ where: { id: productId }, data }),
        prisma.productCategory.deleteMany({ where: { productId, categoryId: { notIn: roomIds } } }),
        prisma.productCategory.createMany({
          data: roomIds.map((categoryId) => ({ productId, categoryId })),
          skipDuplicates: true,
        }),
      ]);
    } else {
      const created = await prisma.product.create({
        data: { ...data, status: "DRAFT", categories: { create: roomIds.map((categoryId) => ({ categoryId })) } },
        select: { id: true },
      });
      createdId = created.id;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { slug: "Ovaj link već koristi drugi proizvod." }, values };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "Proizvod više ne postoji." };
    }
    throw error;
  }

  refreshStorefront();
  if (createdId) redirect(`/admin/proizvodi/${createdId}`);
  return { message: "Izmene su sačuvane." };
}

const statusSchema = z.object({
  productId: z.string().min(1).max(64),
  status: z.enum(["ACTIVE", "DRAFT"]),
});

/** Objavi (vidljiv na sajtu) ili vrati u nacrt (sakriven). Arhiviran se vraća u nacrt istim putem. */
export async function setProductStatus(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const parsed = statusSchema.safeParse({ productId: formData.get("productId"), status: formData.get("status") });
  if (!parsed.success) return { error: "Neispravan zahtev." };
  const { productId, status } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { publishedAt: true, _count: { select: { variants: { where: { isActive: true } } } } },
  });
  if (!product) return { error: "Proizvod više ne postoji." };
  if (status === "ACTIVE" && product._count.variants === 0) {
    return { error: "Pre objave dodajte bar jednu aktivnu varijantu sa lagerom." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: { status, ...(status === "ACTIVE" && !product.publishedAt ? { publishedAt: new Date() } : {}) },
  });

  refreshStorefront();
  return {
    message: status === "ACTIVE" ? "Proizvod je objavljen i vidi se na sajtu." : "Proizvod je sakriven sa sajta.",
  };
}

/**
 * Brisanje. Objavljen proizvod se prvo sakriva, da se ne obriše slučajno.
 * Proizvod koji ima porudžbine se arhivira umesto brisanja: istorija porudžbina ostaje potpuna.
 */
export async function deleteProduct(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/proizvodi");
  const productId = field(formData, "productId");

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { status: true } });
  if (!product) return { error: "Proizvod više ne postoji." };
  if (product.status === "ACTIVE") return { error: "Proizvod je objavljen. Prvo ga sakrijte, pa obrišite." };

  const ordered = await prisma.orderItem.count({ where: { variant: { productId } } });
  if (ordered > 0) {
    await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
    refreshStorefront();
    return { message: "Proizvod ima porudžbine, pa je arhiviran umesto obrisan. Na sajtu se ne prikazuje." };
  }

    const images = await prisma.productImage.findMany({ where: { productId }, select: { path: true } });
  await prisma.product.delete({ where: { id: productId } });
  // Fotografije se brišu i iz Storage-a, posle odgovora (ne usporava brisanje).
  after(() => removeObjects(images.map((image) => image.path)));
  refreshStorefront();
  redirect("/admin/proizvodi");
}

// ─── Varijante ──────────────────────────────────────────────

const variantSchema = z
  .object({
    productId: z.string().min(1).max(64),
    variantId: z
      .string()
      .max(64)
      .transform((value) => value || null),
    colorName: text(40, "Naziv boje"),
    colorHex: z.string().trim(),
    size: text(40, "Veličina"),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .transform((value) => value.replace(/\s+/g, "-"))
      .pipe(
        z
          .string()
          .max(60, { error: "Šifra može imati najviše 60 znakova." })
          .regex(/^[A-Z0-9-]*$/, { error: "Šifra sme sadržati samo slova, cifre i crtice." }),
      ),
    stock: z
      .string()
      .trim()
      .regex(/^\d+$/, { error: "Unesite broj komada." })
      .transform(Number)
      .pipe(z.number().max(MAX_STOCK, { error: "Previše komada." })),
  })
  .superRefine((value, ctx) => {
    if (value.colorName && !/^#[0-9a-f]{6}$/i.test(value.colorHex)) {
      ctx.addIssue({ code: "custom", path: ["colorHex"], message: "Izaberite boju." });
    }
  });

/** Šifra iz linka proizvoda, boje i veličine: PLED-MERINO-KREM-130-170. Dodaje broj ako je zauzeta. */
async function suggestSku(productId: string, colorName: string | null, size: string | null) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  const base = [product?.slug.slice(0, 24), colorName, size]
    .filter(Boolean)
    .map((part) => slugify(part!))
    .join("-")
    .toUpperCase()
    .slice(0, 54);
  for (let n = 1; n < 100; n++) {
    const sku = n === 1 ? base : `${base}-${n}`;
    if (!(await prisma.productVariant.findUnique({ where: { sku }, select: { id: true } }))) return sku;
  }
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}

/** Nova varijanta ili izmena postojeće (boja, veličina, šifra, cena, lager). */
export async function saveVariant(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/proizvodi");

  const values = {
    productId: field(formData, "productId"),
    variantId: field(formData, "variantId"),
    colorName: field(formData, "colorName"),
    colorHex: field(formData, "colorHex"),
    size: field(formData, "size"),
    sku: field(formData, "sku"),
    priceRsd: field(formData, "priceRsd"),
    stock: field(formData, "stock"),
  };
  const isActive = formData.get("isActive") === "on";

  const parsed = variantSchema.safeParse(values);
  const fieldErrors = parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);
  const price = readPrice(values.priceRsd, false);
  if (price.error) fieldErrors.priceRsd = price.error;
  if (!parsed.success || Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const { productId, variantId, colorName, size, stock } = parsed.data;
  const colorHex = colorName ? parsed.data.colorHex.toLowerCase() : null;

  const existing = variantId
    ? await prisma.productVariant.findFirst({ where: { id: variantId, productId }, select: { reserved: true } })
    : null;
  if (variantId && !existing) return { error: "Varijanta više ne postoji. Osvežite stranicu." };
  if (existing && stock < existing.reserved) {
    return {
      fieldErrors: { stock: `Ne može biti manje od rezervisanih komada (${existing.reserved}).` },
      values,
    };
  }
  if (variantId && !isActive && (await wouldLeaveActiveProductEmpty(productId, variantId))) {
    return { error: "Objavljen proizvod mora imati bar jednu aktivnu varijantu. Prvo sakrijte proizvod." };
  }

  const sameOptions = await prisma.productVariant.findFirst({
    where: { productId, colorName, size, ...(variantId ? { id: { not: variantId } } : {}) },
    select: { id: true },
  });
  if (sameOptions) return { error: "Varijanta sa ovom bojom i veličinom već postoji.", values };

  const sku = parsed.data.sku || (await suggestSku(productId, colorName, size));
  const skuTaken = await prisma.productVariant.findFirst({
    where: { sku, ...(variantId ? { id: { not: variantId } } : {}) },
    select: { id: true },
  });
  if (skuTaken) return { fieldErrors: { sku: "Ovu šifru već koristi druga varijanta." }, values };

  const data = { colorName, colorHex, size, sku, priceRsd: price.value, stock, isActive };
  try {
    if (variantId) {
      await prisma.productVariant.update({ where: { id: variantId }, data });
    } else {
      const position = await prisma.productVariant.count({ where: { productId } });
      await prisma.productVariant.create({ data: { ...data, productId, position } });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Šifra ili kombinacija boje i veličine je već zauzeta.", values };
    }
    throw error;
  }

  refreshStorefront();
  return { message: variantId ? "Varijanta je sačuvana." : "Varijanta je dodata." };
}

/**
 * Brisanje varijante. Sa rezervisanim komadima se ne briše (otvorene porudžbine);
 * ako je već naručivana, samo se isključuje, da stare porudžbine zadrže vezu.
 */
export async function deleteVariant(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/proizvodi");
  const productId = field(formData, "productId");
  const variantId = field(formData, "variantId");

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    select: { reserved: true, isActive: true, _count: { select: { orderItems: true } } },
  });
  if (!variant) return { error: "Varijanta više ne postoji." };
  if (variant.reserved > 0) {
    return { error: "Varijanta ima rezervisane komade u otvorenim porudžbinama. Obrišite je kad se one završe." };
  }
  if (variant.isActive && (await wouldLeaveActiveProductEmpty(productId, variantId))) {
    return { error: "Objavljen proizvod mora imati bar jednu aktivnu varijantu. Prvo sakrijte proizvod." };
  }

  if (variant._count.orderItems > 0) {
    await prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
    refreshStorefront();
    return { message: "Varijanta je naručivana, pa je isključena umesto obrisana." };
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  refreshStorefront();
  return { message: "Varijanta je obrisana." };
}