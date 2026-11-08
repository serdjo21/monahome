"use client";

import type { ReactNode } from "react";

import { useUrlSearch } from "@/lib/use-url-search";
import type { ProductDetail } from "@/server/storefront/types";

import { ProductGallery } from "./product-gallery";
import { ProductPurchase } from "./product-purchase";
import { imagesForColor, resolveSelection } from "./variant-selection";

type ProductViewProps = {
  product: ProductDetail;
  /** Naziv i putanja, renderovani na serveru. */
  header: ReactNode;
  /** Harmonika sa opisom, negom i dostavom, renderovana na serveru. */
  details: ReactNode;
};

/**
 * Galerija i panel dele izbor boje: klik na boju menja i fotografije.
 * Statični delovi (header, details) stižu gotovi sa servera, ovde se samo slažu.
 */
export function ProductView({ product, header, details }: ProductViewProps) {
  const [search, updateSearch] = useUrlSearch();
  const selection = resolveSelection(product, search);
  const images = imagesForColor(product, selection.color);

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-6">
      <div className="-mx-5 md:-mx-10 lg:col-span-7 lg:mx-0">
        <ProductGallery key={selection.color ?? "sve"} images={images} productName={product.name} />
      </div>

      <div className="lg:col-span-5 xl:col-span-4 xl:col-start-9">
        <div className="flex flex-col gap-10 lg:sticky lg:top-24 xl:top-36">
          {header}
          <ProductPurchase product={product} selection={selection} onSelect={updateSearch} />
          {details}
        </div>
      </div>
    </div>
  );
}