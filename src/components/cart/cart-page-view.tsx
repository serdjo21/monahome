"use client";

import { TextLink } from "@/components/ui/button";
import { useCartReady } from "@/lib/cart/store";

import { CartLineItem, CartLinesSkeleton, CartNotices } from "./cart-line-item";
import { CartSummary } from "./cart-summary";
import { useCartLines } from "./use-cart-lines";

/** Puna stranica korpe: stavke levo, međuzbir desno (na desktopu ostaje na mestu pri skrolovanju). */
export function CartPageView() {
  const ready = useCartReady();
  const { lines, subtotal, isEmpty, isLoading, notices } = useCartLines(true);

  if (!ready || (isLoading && lines.length === 0)) {
    return <CartLinesSkeleton count={3} />;
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-start gap-6 border-t border-hairline py-16">
        <p className="font-display text-display-3 text-ink italic">Vaša korpa je prazna.</p>
        <TextLink href="/">Nastavite kupovinu</TextLink>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-6">
      <div className="lg:col-span-7">
        <CartNotices notices={notices} />
        <ul className="border-t border-hairline">
          {lines.map((line) => (
            <CartLineItem key={line.variantId} line={line} />
          ))}
        </ul>
      </div>
      <div className="lg:col-span-4 lg:col-start-9">
        <div className="bg-surface-raised p-6 md:p-8 lg:sticky lg:top-24 xl:top-36">
          <CartSummary subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}