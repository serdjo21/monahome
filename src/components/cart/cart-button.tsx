"use client";

import { BagIcon } from "@/components/ui/icons";
import { openCart, useCartCount } from "@/lib/cart/store";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";

/** Dugme u headeru koje otvara panel korpe: ikonica sa brojem (telefon) ili „Korpa (2)“ (desktop). */
export function CartButton({ variant, className }: { variant: "icon" | "text"; className?: string }) {
  const count = useCartCount();
  const label = `Korpa, ${formatCount(count, ["proizvod", "proizvoda", "proizvoda"])}`;

  if (variant === "text") {
    return (
      <button type="button" onClick={openCart} aria-haspopup="dialog" aria-label={label} className={className}>
        Korpa ({count})
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCart}
      aria-haspopup="dialog"
      aria-label={label}
      className={cn("relative", className)}
    >
      <BagIcon />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1 h-4 min-w-4 rounded-full bg-accent px-1 text-center text-[0.625rem] leading-4 font-medium text-on-accent"
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}