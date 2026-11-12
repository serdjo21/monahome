import type { Metadata } from "next";

import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = {
  title: "Korpa",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="container-page py-12 md:py-20">
      <h1 className="mb-10 font-display text-[3rem] leading-none tracking-[-0.02em] text-ink md:mb-14 md:text-display-1">
        Korpa
      </h1>
      <CartPageView />
    </div>
  );
}