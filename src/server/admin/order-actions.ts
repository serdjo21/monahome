"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import type { OrderStatus } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/auth-forms";
import { ORDER_TRANSITIONS } from "@/lib/order-status";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { sendOrderShippedEmail } from "@/server/email/order-emails";
import { CACHE_TAGS } from "@/server/storefront";

const statusSchema = z.object({
  orderId: z.string().min(1).max(64),
  status: z.enum(["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  courier: z
    .string()
    .trim()
    .max(60, { error: "Naziv kurirske službe je predugačak." })
    .transform((value) => value || null),
  trackingNumber: z
    .string()
    .trim()
    .max(60, { error: "Broj pošiljke je predugačak." })
    .transform((value) => value || null),
});

const TIMESTAMP: Partial<Record<OrderStatus, "confirmedAt" | "shippedAt" | "deliveredAt" | "cancelledAt">> = {
  CONFIRMED: "confirmedAt",
  SHIPPED: "shippedAt",
  DELIVERED: "deliveredAt",
  CANCELLED: "cancelledAt",
};

/**
 * Promena statusa sa lagerom, u jednoj transakciji:
 * poslata → komadi se skidaju sa stanja (i iz rezervacije); otkazana → rezervisani komadi se vraćaju.
 * Uslov „status je i dalje onaj koji je admin video“ sprečava dvostruku obradu (dupli klik, dva taba).
 */
export async function updateOrderStatus(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/porudzbine");

  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    courier: formData.get("courier") ?? "",
    trackingNumber: formData.get("trackingNumber") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Neispravan zahtev." };
  const { orderId, status: next, courier, trackingNumber } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, items: { select: { variantId: true, quantity: true } } },
    });
    if (!order) return { error: "Porudžbina ne postoji." };
    if (!ORDER_TRANSITIONS[order.status].includes(next)) {
      return { error: "Ovaj korak nije moguć za trenutni status porudžbine." };
    }

    const timestamp = TIMESTAMP[next];
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: next,
        ...(timestamp ? { [timestamp]: new Date() } : {}),
        ...(next === "SHIPPED" ? { courier, trackingNumber } : {}),
      },
    });
    if (updated.count === 0) return { error: "Porudžbina je u međuvremenu izmenjena. Osvežite stranicu." };

    // Stavke čija je varijanta obrisana (variantId = null) nemaju lager koji bi se menjao.
    for (const item of order.items) {
      if (!item.variantId) continue;
      if (next === "SHIPPED") {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity }, reserved: { decrement: item.quantity } },
        });
      } else if (next === "CANCELLED") {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reserved: { decrement: item.quantity } },
        });
      }
    }
    return null;
  });

  if (result?.error) return result;

  if (next === "SHIPPED" || next === "CANCELLED") revalidateTag(CACHE_TAGS.products, "max");
  if (next === "SHIPPED") after(() => sendOrderShippedEmail(orderId, trackingNumber, courier));
  revalidatePath("/admin", "layout");

  const messages: Record<typeof next, string> = {
    CONFIRMED: "Porudžbina je potvrđena.",
    SHIPPED: "Porudžbina je označena kao poslata. Kupcu je poslat mejl.",
    DELIVERED: "Porudžbina je označena kao isporučena.",
    CANCELLED: "Porudžbina je otkazana, a rezervisani komadi su vraćeni na stanje.",
  };
  return { message: messages[next] };
}

const noteSchema = z.object({
  orderId: z.string().min(1).max(64),
  internalNote: z
    .string()
    .trim()
    .max(2000, { error: "Napomena može imati najviše 2.000 znakova." })
    .transform((value) => value || null),
});

/** Interna napomena uz porudžbinu; kupac je nikad ne vidi. */
export async function saveOrderNote(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/porudzbine");

  const parsed = noteSchema.safeParse({ orderId: formData.get("orderId"), internalNote: formData.get("internalNote") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Neispravan zahtev." };

  await prisma.order.update({ where: { id: parsed.data.orderId }, data: { internalNote: parsed.data.internalNote } });
  revalidatePath(`/admin/porudzbine/${parsed.data.orderId}`);
  return { message: "Napomena je sačuvana." };
}