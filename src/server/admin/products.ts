import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db";

export const PRODUCTS_PAGE_SIZE = 25;

export async function listProducts({
  status,
  query,
  roomId,
  page,
}: {
  status: ProductStatus | null;
  query: string;
  roomId: string | null;
  page: number;
}) {
  const q = query.trim();

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(roomId ? { categories: { some: { categoryId: roomId } } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        subtitle: true,
        status: true,
        priceRsd: true,
        compareAtRsd: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { path: true, alt: true } },
        categories: { orderBy: { category: { position: "asc" } }, select: { category: { select: { name: true } } } },
        variants: { where: { isActive: true }, select: { stock: true, reserved: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const products = rows.map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    status: row.status,
    priceRsd: row.priceRsd,
    compareAtRsd: row.compareAtRsd,
    image: row.images[0] ?? null,
    rooms: row.categories.map((c) => c.category.name),
    variantCount: row.variants.length,
    available: row.variants.reduce((sum, v) => sum + Math.max(0, v.stock - v.reserved), 0),
  }));

  return { products, total, pages: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)) };
}

export async function countProductsByStatus(): Promise<Record<ProductStatus, number>> {
  const groups = await prisma.product.groupBy({ by: ["status"], _count: true });
  const counts: Record<ProductStatus, number> = { ACTIVE: 0, DRAFT: 0, ARCHIVED: 0 };
  for (const group of groups) counts[group.status] = group._count;
  return counts;
}

/** Sve sobe (i skrivene), za izbor u formi i filter liste. */
export function getRoomOptions() {
  return prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true, isVisible: true },
  });
}

export async function getAdminProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      subtitle: true,
      description: true,
      care: true,
      priceRsd: true,
      compareAtRsd: true,
      status: true,
      isNew: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      categories: { select: { categoryId: true } },
      images: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { id: true, path: true, alt: true, variantId: true },
      },
      variants: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: {
          id: true,
          sku: true,
          colorName: true,
          colorHex: true,
          size: true,
          priceRsd: true,
          stock: true,
          reserved: true,
          isActive: true,
          _count: { select: { orderItems: true } },
        },
      },
    },
  });
  if (!product) return null;

  return {
    ...product,
    roomIds: product.categories.map((c) => c.categoryId),
  };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;
export type AdminVariant = AdminProduct["variants"][number];