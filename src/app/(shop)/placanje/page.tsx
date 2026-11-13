import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Plaćanje",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-12 md:py-20">
      <h1 className="mb-10 font-display text-[3rem] leading-none tracking-[-0.02em] text-ink md:mb-14 md:text-display-1">
        Plaćanje
      </h1>
      <CheckoutView />
    </div>
  );
}