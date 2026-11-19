import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db";

export const ORDERS_PAGE_SIZE = 25;

/** „MH-1002“, „mh1002“ ili „1002“ → redni broj u bazi (1002 − 1000). */
function parseOrderNumber(query: string): number | null {
  const match = query.trim().match(/^(?:mh-?)?(\d{4,})$/i);
  if (!match) return null;
  const number = Number(match[1]) - 1000;
  return number > 0 ? number : null;
}

export async function listOrders({ status, query, page }: { status: OrderStatus | null; query: string; page: number }) {
  const q = query.trim();
  const number = q ? parseOrderNumber(q) : null;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? number
        ? { number }
        : {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: { id: true, number: true, fullName: true, city: true, totalRsd: true, status: true, createdAt: true },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)) };
}

/** Broj porudžbina po statusu, za brojeve na tabovima. */
export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const groups = await prisma.order.groupBy({ by: ["status"], _count: true });
  const counts: Record<OrderStatus, number> = { NEW: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
  for (const group of groups) counts[group.status] = group._count;
  return counts;
}

export function countNewOrders() {
  return prisma.order.count({ where: { status: "NEW" } });
}

export function getAdminOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    select: {
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
      internalNote: true,
      courier: true,
      trackingNumber: true,
      subtotalRsd: true,
      shippingRsd: true,
      totalRsd: true,
      createdAt: true,
      confirmedAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
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
    },
  });
}

export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;