"use client";

import { useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { addToCart, openCart } from "@/lib/cart/store";
import { cn } from "@/lib/cn";
import { formatCount, formatRsd } from "@/lib/format";
import { slugify } from "@/lib/slug";
import type { ProductDetail } from "@/server/storefront/types";

import { findVariant, isColorAvailable, type Selection } from "./variant-selection";

type ProductPurchaseProps = {
  product: ProductDetail;
  selection: Selection;
  onSelect: (changes: Record<string, string | null>) => void;
};

/** Ispod ovoliko komada prikazuje se „Još N komada“. */
const LOW_STOCK = 3;

/** Cena, boja, veličina, stanje, količina i dugme za korpu. Izbor živi u URL-u, količina lokalno. */
export function ProductPurchase({ product, selection, onSelect }: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1);

  const { variant } = selection;
  const available = variant?.available ?? 0;
  const canBuy = available > 0;
  const qty = Math.min(quantity, Math.max(available, 1));

  const price = variant?.priceRsd ?? product.priceRsd;
  const compareAt = product.compareAtRsd !== null && product.compareAtRsd > price ? product.compareAtRsd : null;

  function selectColor(color: string) {
    // Veličina ostaje ako je ima u novoj boji; inače se bira prva dostupna.
    const keepSize = selection.size && (findVariant(product, color, selection.size)?.available ?? 0) > 0;
    onSelect({ boja: slugify(color), velicina: keepSize && selection.size ? slugify(selection.size) : null });
  }

  function handleAdd() {
    if (!variant || !canBuy) return;
    addToCart(variant.id, qty, available);
    openCart();
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="flex items-baseline gap-3 text-body-lg font-medium tracking-[0.02em] text-ink">
        {compareAt !== null ? (
          <>
            <span className="sr-only">Nova cena:</span>
            <span className="text-accent">{formatRsd(price)}</span>
            <span className="sr-only">Stara cena:</span>
            <s className="text-body font-normal text-ink-muted">{formatRsd(compareAt)}</s>
          </>
        ) : (
          formatRsd(price)
        )}
      </p>

      {product.colors.length > 0 ? (
        <fieldset>
          <legend className="label mb-4 text-ink">
            <span className="text-ink-muted">Boja: </span>
            {selection.color}
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => {
              const soldOut = !isColorAvailable(product, color.name);
              return (
                <label key={color.name} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="boja"
                    value={color.name}
                    checked={selection.color === color.name}
                    onChange={() => selectColor(color.name)}
                    className="peer sr-only"
                  />
                  <span className="sr-only">
                    {color.name}
                    {soldOut ? " (rasprodato)" : ""}
                  </span>
                  <span
                    aria-hidden="true"
                    className="block size-9 rounded-full border border-hairline outline-offset-[3px] peer-checked:outline peer-checked:outline-1 peer-checked:outline-ink peer-focus-visible:outline-2 peer-focus-visible:outline-ink"
                    style={{ backgroundColor: color.hex }}
                  />
                  {soldOut ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-1/2 h-px w-11 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink-muted"
                    />
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {product.sizes.length > 1 ? (
        <fieldset>
          <legend className="label mb-4 text-ink-muted">Veličina</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const option = findVariant(product, selection.color, size);
              const soldOut = !option || option.available === 0;
              return (
                <label key={size} className={cn(soldOut ? "cursor-not-allowed" : "cursor-pointer")}>
                  <input
                    type="radio"
                    name="velicina"
                    value={size}
                    checked={selection.size === size}
                    disabled={soldOut}
                    onChange={() => onSelect({ velicina: slugify(size) })}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "inline-flex h-11 min-w-16 items-center justify-center border border-hairline px-4 text-body text-ink transition-colors",
                      "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-surface",
                      "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                      soldOut ? "text-ink-muted line-through" : "hover:border-ink",
                    )}
                  >
                    {size}
                    {soldOut ? <span className="sr-only"> (rasprodato)</span> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : product.sizes.length === 1 ? (
        <p className="text-body text-ink">
          <span className="label mr-2 text-ink-muted">Dimenzije</span>
          {product.sizes[0]}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2.5 text-caption text-ink-muted" aria-live="polite">
          <span
            aria-hidden="true"
            className={cn("size-1.5 rounded-full", !canBuy ? "bg-ink-muted" : available <= LOW_STOCK ? "bg-accent" : "bg-ink")}
          />
          {!canBuy
            ? "Rasprodato"
            : available <= LOW_STOCK
              ? `Još ${formatCount(available, ["komad", "komada", "komada"])}`
              : "Na stanju"}
        </p>

        <div className="flex gap-3">
          {canBuy ? <QuantityStepper value={qty} max={available} onChange={setQuantity} /> : null}

          <button
            type="button"
            onClick={handleAdd}
            disabled={!canBuy}
            className={buttonClass("primary", "flex-1 disabled:cursor-not-allowed disabled:opacity-50")}
          >
            {canBuy ? "Dodaj u korpu" : "Rasprodato"}
          </button>
        </div>

        <p className="text-caption text-ink-muted">Plaćanje pouzećem · Dostava 2–4 radna dana · Povraćaj 14 dana</p>
      </div>
    </div>
  );
}