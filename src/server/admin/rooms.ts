import "server-only";

import { prisma } from "@/server/db";

/** Sve sobe redom kao u meniju, sa brojem proizvoda (ukupno i objavljenih). */
export async function listRooms() {
  const rows = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imagePath: true,
      isVisible: true,
      products: { select: { product: { select: { status: true } } } },
    },
  });

  return rows.map(({ products, ...room }) => ({
    ...room,
    productCount: products.length,
    activeCount: products.filter((item) => item.product.status === "ACTIVE").length,
  }));
}

export function getAdminRoom(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      isVisible: true,
      imagePath: true,
      imageAlt: true,
      heroTheme: true,
      heroImagePath: true,
      heroImageMobilePath: true,
      heroImageAlt: true,
      heroFocalX: true,
      heroFocalY: true,
      editorialText: true,
      editorialImagePath: true,
      editorialImageAlt: true,
      _count: { select: { products: true } },
    },
  });
}

export type AdminRoom = NonNullable<Awaited<ReturnType<typeof getAdminRoom>>>;