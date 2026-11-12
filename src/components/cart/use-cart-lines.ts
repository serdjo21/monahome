"use client";

import { useEffect, useState } from "react";

import { getCartItems, removeFromCart, setCartQuantity, useCartItems } from "@/lib/cart/store";
import type { CartLine } from "@/lib/cart/types";
import { getCartLines } from "@/server/cart";

export type DisplayLine = CartLine & { quantity: number };

type Fetched = { key: string; lines: Map<string, CartLine>; notices: string[] };

/**
 * Stavke korpe sa svežim cenama i stanjem. Server se pita kad se panel otvori (`enabled`)
 * i kad se promeni skup varijanti; promena količine je trenutna, bez poziva serveru.
 * Rasprodato i nedostupno se uklanja, a prevelika količina smanjuje, uz kratku poruku.
 */
export function useCartLines(enabled: boolean) {
  const items = useCartItems();
  const [fetched, setFetched] = useState<Fetched | null>(null);

  const key = items
    .map((item) => item.variantId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!enabled || key === "") return;
    let cancelled = false;

    getCartLines(key.split(",")).then((lines) => {
      if (cancelled) return;
      const byId = new Map(lines.map((line) => [line.variantId, line]));
      const notices: string[] = [];
      const toRemove: string[] = [];

      for (const item of getCartItems()) {
        const line = byId.get(item.variantId);
        if (!line) {
          toRemove.push(item.variantId);
          notices.push("Jedan proizvod više nije dostupan i uklonjen je iz korpe.");
        } else if (line.available === 0) {
          toRemove.push(item.variantId);
          notices.push(`${line.productName} je rasprodat i uklonjen je iz korpe.`);
        } else if (item.quantity > line.available) {
          setCartQuantity(item.variantId, line.available);
          notices.push(`${line.productName}: na stanju je još ${line.available}, količina je smanjena.`);
        }
      }

      if (toRemove.length > 0) removeFromCart(toRemove);
      // Posle uklanjanja ključ će se promeniti; poruke čuvamo pod novim ključem da ne nestanu.
      const nextKey = getCartItems()
        .map((item) => item.variantId)
        .sort()
        .join(",");
      setFetched({ key: nextKey, lines: byId, notices });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, key]);

  const lines: DisplayLine[] = items.flatMap((item) => {
    const line = fetched?.lines.get(item.variantId);
    return line ? [{ ...line, quantity: item.quantity }] : [];
  });

  return {
    lines,
    subtotal: lines.reduce((sum, line) => sum + line.unitPriceRsd * line.quantity, 0),
    isEmpty: items.length === 0,
    isLoading: items.length > 0 && fetched?.key !== key,
    notices: fetched?.key === key ? fetched.notices : [],
  };
}