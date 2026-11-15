import type { OrderStatus } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Nova",
  CONFIRMED: "Potvrđena",
  SHIPPED: "Poslata",
  DELIVERED: "Isporučena",
  CANCELLED: "Otkazana",
};

const dateTime = new Intl.DateTimeFormat("sr-Latn-RS", {
  timeZone: "Europe/Belgrade",
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const date = new Intl.DateTimeFormat("sr-Latn-RS", {
  timeZone: "Europe/Belgrade",
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

/** „15. 11. 2026. 19:42“, uvek po beogradskom vremenu (server na Vercelu radi u UTC-u). */
export const formatDateTime = (value: Date) => dateTime.format(value);
export const formatDate = (value: Date) => date.format(value);