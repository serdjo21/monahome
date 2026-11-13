"use server";

import { randomBytes } from "node:crypto";

import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/cart/types";
import {
  CHECKOUT_FIELDS,
  checkoutSchema,
  type CheckoutField,
  type CheckoutState,
  type CheckoutValues,
  type StockAdjustment,
} from "@/lib/checkout";
import { prisma } from "@/server/db";
import { sendOrderEmails } from "@/server/email/order-emails";
import { CACHE_TAGS } from "@/server/storefront";

const itemsSchema = z
  .array(
    z.object({
      variantId: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
    }),
  )
  .min(1)
  .max(MAX_CART_LINES);

function parseItems(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") return null;
  try {
    const parsed = itemsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    // Ista varijanta dva puta (npr. dva taba): saberi.
    const merged = new Map<string, number>();
    for (const item of parsed.data) merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
    return [...merged].map(([variantId, quantity]) => ({ variantId, quantity: Math.min(quantity, MAX_LINE_QUANTITY) }));
  } catch {
    return null;
  }
}

/** Sukob dve istovremene transakcije (Postgres 40001): bezbedno se ponavlja. */
function isSerializationFailure(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return true;
  return error instanceof Error && /40001|could not serialize/i.test(error.message);
}

type Line = { variantId: string; quantity: number };

/**
 * U jednoj SERIALIZABLE transakciji: sveže cene iz baze, provera lagera, rezervacija komada i porudžbina.
 * Dva kupca ne mogu istovremeno kupiti poslednji komad: jedna transakcija prođe, druga se ponovi i vidi novo stanje.
 */
async function createOrder(data: z.output<typeof checkoutSchema>, items: Line[]) {
  return prisma.$transaction(
    async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: items.map((item) => item.variantId) } },
        select: {
          id: true,
          sku: true,
          colorName: true,
          size: true,
          priceRsd: true,
          stock: true,
          reserved: true,
          isActive: true,
          product: { select: { name: true, priceRsd: true, status: true } },
        },
      });
      const byId = new Map(variants.map((variant) => [variant.id, variant]));

      const adjustments: StockAdjustment[] = [];
      for (const item of items) {
        const variant = byId.get(item.variantId);
        const available =
          variant && variant.isActive && variant.product.status === "ACTIVE"
            ? Math.max(0, variant.stock - variant.reserved)
            : 0;
        if (item.quantity > available) adjustments.push({ variantId: item.variantId, available });
      }
      if (adjustments.length > 0) return { kind: "stock" as const, adjustments };

      const lines = items.map((item) => {
        const variant = byId.get(item.variantId)!;
        const unitPriceRsd = variant.priceRsd ?? variant.product.priceRsd;
        const label = [variant.colorName, variant.size].filter(Boolean).join(" · ");
        return {
          variantId: variant.id,
          sku: variant.sku,
          productName: variant.product.name,
          variantLabel: label || null,
          unitPriceRsd,
          quantity: item.quantity,
          lineTotalRsd: unitPriceRsd * item.quantity,
        };
      });
      const subtotalRsd = lines.reduce((sum, line) => sum + line.lineTotalRsd, 0);
      // Dostava se dodaje kad se utvrde cene kurira; do tada se plaća pri preuzimanju.
      const shippingRsd = 0;

      for (const line of lines) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { reserved: { increment: line.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          email: data.email,
          phone: data.phone,
          fullName: data.fullName,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          note: data.note,
          subtotalRsd,
          shippingRsd,
          totalRsd: subtotalRsd + shippingRsd,
          accessToken: randomBytes(24).toString("base64url"),
          items: { create: lines },
        },
        select: { id: true, accessToken: true },
      });

      return { kind: "ok" as const, order };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function placeOrder(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values: CheckoutValues = {};
  for (const field of CHECKOUT_FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  // Skriveno polje koje ljudi ne vide; popunjava ga samo bot.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "error", values, formError: "Porudžbina nije poslata. Pokušajte ponovo." };
  }

  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<CheckoutField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as CheckoutField;
      fieldErrors[field] ??= issue.message;
    }
    return { status: "error", values, fieldErrors };
  }

  const items = parseItems(formData.get("items"));
  if (!items) {
    return { status: "error", values, formError: "Korpa je prazna ili neispravna. Osvežite stranicu i pokušajte ponovo." };
  }

  let result: Awaited<ReturnType<typeof createOrder>> | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await createOrder(parsed.data, items);
      break;
    } catch (error) {
      if (attempt < 3 && isSerializationFailure(error)) continue;
      console.error("[porudžbina] Greška:", error);
      return { status: "error", values, formError: "Porudžbina nije prošla zbog greške na našoj strani. Pokušajte ponovo za minut." };
    }
  }

  if (!result) {
    return { status: "error", values, formError: "Previše porudžbina u istom trenutku. Pokušajte ponovo." };
  }

  if (result.kind === "stock") {
    return {
      status: "error",
      values,
      adjustments: result.adjustments,
      formError: "Nekih proizvoda je u međuvremenu nestalo ili ih ima manje. Korpa je ažurirana; proverite je i poručite ponovo.",
    };
  }

  // Stanje lagera se promenilo: stranice proizvoda i soba prikazuju novo stanje.
  revalidateTag(CACHE_TAGS.products, "max");

  const orderId = result.order.id;
  after(() => sendOrderEmails(orderId));

  return { status: "success", href: `/porudzbina/${result.order.accessToken}` };
}