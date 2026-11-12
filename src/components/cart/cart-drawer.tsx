"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { TextLink } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import { closeCart, useCartCount, useCartOpen } from "@/lib/cart/store";

import { CartLineItem, CartLinesSkeleton, CartNotices } from "./cart-line-item";
import { CartSummary } from "./cart-summary";
import { useCartLines } from "./use-cart-lines";

/**
 * Panel korpe zdesna. Nativni <dialog> (showModal) daje zarobljen fokus, Esc,
 * neaktivnu pozadinu i vraćanje fokusa na dugme koje ga je otvorilo, bez biblioteke.
 */
export function CartDrawer() {
  const open = useCartOpen();
  const count = useCartCount();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { lines, subtotal, isEmpty, isLoading, notices } = useCartLines(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Prelazak na drugu stranicu (npr. dugme „nazad“) zatvara panel.
  useEffect(() => {
    closeCart();
  }, [pathname]);

  return (
    <dialog
      ref={dialogRef}
      data-theme="kamen"
      aria-labelledby="korpa-naslov"
      onClose={closeCart}
      onClick={(event) => {
        // Klik na zatamnjenu pozadinu (sam <dialog>, ne njegov sadržaj) zatvara panel.
        if (event.target === event.currentTarget) closeCart();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md translate-x-full bg-surface p-0 text-ink transition-[translate,overlay,display] transition-discrete duration-500 ease-editorial backdrop:bg-espreso/0 backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-500 open:translate-x-0 open:backdrop:bg-espreso/40 starting:open:translate-x-full starting:open:backdrop:bg-espreso/0"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-hairline px-5 md:px-8 xl:h-[4.5rem]">
          <h2 id="korpa-naslov" className="font-display text-display-3 text-ink">
            Korpa
            {count > 0 ? <span className="ml-2 font-sans text-body text-ink-muted">({count})</span> : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            autoFocus
            aria-label="Zatvori korpu"
            className="-mr-2.5 inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-ink-muted"
          >
            <CloseIcon />
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-6 px-5 md:px-8">
            <p className="font-display text-display-3 text-ink italic">Vaša korpa je prazna.</p>
            <TextLink href="/" onClick={closeCart}>
              Nastavite kupovinu
            </TextLink>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 md:px-8">
              <CartNotices notices={notices} />
              {isLoading && lines.length === 0 ? (
                <CartLinesSkeleton />
              ) : (
                <ul>
                  {lines.map((line) => (
                    <CartLineItem key={line.variantId} line={line} onNavigate={closeCart} />
                  ))}
                </ul>
              )}
            </div>
            <div className="shrink-0 border-t border-hairline px-5 py-6 md:px-8">
              <CartSummary subtotal={subtotal} onNavigate={closeCart} showCartLink />
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}