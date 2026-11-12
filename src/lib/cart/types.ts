import type { Media } from "@/server/storefront/types";

/** Ono što se čuva u browseru: samo varijanta i količina. Cene i nazivi uvek dolaze sa servera. */
export type CartItem = { variantId: string; quantity: number };

/** Stavka korpe sa svežim podacima iz baze. */
export type CartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  /** „Kamen · 70 × 140 cm“; null kad proizvod nema ni boju ni veličinu. */
  variantLabel: string | null;
  image: Media;
  unitPriceRsd: number;
  available: number;
};

export const MAX_LINE_QUANTITY = 99;
export const MAX_CART_LINES = 50;