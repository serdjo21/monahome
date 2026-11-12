"use server";

import { z } from "zod";

import { MAX_CART_LINES, type CartLine } from "@/lib/cart/types";
import { prisma } from "@/server/db";
import { toMedia } from "@/server/storefront/media";

const idsSchema = z.array(z.string().min(1).max(64)).max(MAX_CART_LINES);

/**
 * Sveži podaci za stavke iz korpe: naziv, slika, cena i stanje iz baze.
 * Varijante koje više ne postoje, nisu aktivne ili proizvod nije objavljen jednostavno se ne vraćaju.
 * Ništa se ne kešira: korpa mora da vidi trenutnu cenu i lager.
 */
export async function getCartLines(variantIds: string[]): Promise<CartLine[]> {
  // Ulaz stiže iz browsera, pa se proverava kao i svaki drugi korisnički unos.
  const parsed = idsSchema.safeParse(variantIds);
  if (!parsed.success || parsed.data.length === 0) return [];

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: parsed.data },
      isActive: true,
      product: { status: "ACTIVE" },
    },
    select: {
      id: true,
      colorName: true,
      size: true,
      priceRsd: true,
      stock: true,
      reserved: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { path: true, alt: true } },
      product: {
        select: {
          slug: true,
          name: true,
          priceRsd: true,
          images: { orderBy: { position: "asc" }, take: 1, select: { path: true, alt: true } },
        },
      },
    },
  });

  return variants.map((variant) => {
    const image = variant.images[0] ?? variant.product.images[0];
    const label = [variant.colorName, variant.size].filter(Boolean).join(" · ");
    return {
      variantId: variant.id,
      productSlug: variant.product.slug,
      productName: variant.product.name,
      variantLabel: label || null,
      image: toMedia(image?.path, image?.alt, variant.product.name),
      unitPriceRsd: variant.priceRsd ?? variant.product.priceRsd,
      available: Math.max(0, variant.stock - variant.reserved),
    };
  });
}