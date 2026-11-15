import "server-only";

import { prisma } from "@/server/db";

const ZONE = "Europe/Belgrade";

/** Ponoć (ili prvi dan meseca) po beogradskom vremenu, kao UTC trenutak za upit u bazi. */
function startOf(unit: "day" | "month", now = new Date()): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const local = `${parts.year}-${parts.month}-${unit === "day" ? parts.day : "01"}T00:00:00`;
  // Razlika između Beograda i UTC-a u tom trenutku (zimsko/letnje računanje vremena).
  const zoned = new Date(now.toLocaleString("en-US", { timeZone: ZONE }));
  const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(new Date(`${local}Z`).getTime() - (zoned.getTime() - utc.getTime()));
}

async function revenueSince(since: Date) {
  const result = await prisma.order.aggregate({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    _sum: { totalRsd: true },
    _count: true,
  });
  return { total: result._sum.totalRsd ?? 0, count: result._count };
}

/** Ispod ovoliko dostupnih komada varijanta je na listi „malo na lageru“. */
const LOW_STOCK = 3;

export async function getDashboard() {
  const [newOrders, today, month, recentOrders, variants] = await Promise.all([
    prisma.order.count({ where: { status: "NEW" } }),
    revenueSince(startOf("day")),
    revenueSince(startOf("month")),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, number: true, fullName: true, totalRsd: true, status: true, createdAt: true },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, product: { status: "ACTIVE" } },
      select: {
        id: true,
        sku: true,
        colorName: true,
        size: true,
        stock: true,
        reserved: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const lowStock = variants
    .map((variant) => ({ ...variant, available: Math.max(0, variant.stock - variant.reserved) }))
    .filter((variant) => variant.available <= LOW_STOCK)
    .sort((a, b) => a.available - b.available)
    .slice(0, 8);

  return { newOrders, today, month, recentOrders, lowStock };
}