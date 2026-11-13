import "server-only";

import { prisma } from "@/server/db";

const orderSelect = {
  id: true,
  number: true,
  status: true,
  email: true,
  phone: true,
  fullName: true,
  address: true,
  postalCode: true,
  city: true,
  note: true,
  subtotalRsd: true,
  shippingRsd: true,
  totalRsd: true,
  createdAt: true,
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      sku: true,
      productName: true,
      variantLabel: true,
      unitPriceRsd: true,
      quantity: true,
      lineTotalRsd: true,
    },
  },
} as const;

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

export function getOrderById(id: string) {
  return prisma.order.findUnique({ where: { id }, select: orderSelect });
}

/** Za stranicu „Hvala“: samo ko ima tajni link vidi porudžbinu. Bez keša, uvek sveže. */
export function getOrderByToken(token: string) {
  if (token.length < 20 || token.length > 64) return null;
  return prisma.order.findUnique({ where: { accessToken: token }, select: orderSelect });
}