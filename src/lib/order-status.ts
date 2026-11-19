import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Dozvoljeni sledeći koraci za svaki status. Server odbija sve ostalo,
 * pa se isporučena ne može vratiti na novu, niti poslata otkazati.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Statusi u URL-u liste (?status=nove), čitljivo i bez engleskih reči. */
export const STATUS_SLUGS: Record<string, OrderStatus> = {
  nove: "NEW",
  potvrdjene: "CONFIRMED",
  poslate: "SHIPPED",
  isporucene: "DELIVERED",
  otkazane: "CANCELLED",
};

export const STATUS_TABS: { slug: string; label: string; status: OrderStatus | null }[] = [
  { slug: "nove", label: "Nove", status: "NEW" },
  { slug: "potvrdjene", label: "Potvrđene", status: "CONFIRMED" },
  { slug: "poslate", label: "Poslate", status: "SHIPPED" },
  { slug: "isporucene", label: "Isporučene", status: "DELIVERED" },
  { slug: "otkazane", label: "Otkazane", status: "CANCELLED" },
  { slug: "sve", label: "Sve", status: null },
];

/** Predlozi u polju „Kurirska služba“ (može se upisati i bilo šta drugo). */
export const COURIERS = ["Post Express", "D Express", "BEX", "AKS", "City Express", "DHL"];