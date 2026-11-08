import { Fragment } from "react";

import { ProductCard } from "@/components/product/product-card";
import { formatCount } from "@/lib/format";
import { getRoomProducts, parseRoomSort } from "@/server/storefront";
import type { RoomDetail } from "@/server/storefront/types";

import { RoomEditorial } from "./room-editorial";
import { SortMenu } from "./sort-menu";

type RoomProductsProps = {
  slug: string;
  editorial: RoomDetail["editorial"];
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const grid = "grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4";

/** Od koliko proizvoda je prvi istaknut (duplo veći); sa manje bi mreža izgledala prazno. */
const FEATURE_FROM = 5;

/**
 * Traka (broj proizvoda + sortiranje) i mreža sobe. Čita ?sort= iz URL-a.
 * Ritam mreže: prvi proizvod 2×2, pa editorijal prekid posle prvog bloka (ako je podešen u adminu).
 */
export async function RoomProducts({ slug, editorial, searchParams }: RoomProductsProps) {
  const sort = parseRoomSort((await searchParams).sort);
  const products = await getRoomProducts(slug, sort);

  if (products.length === 0) {
    return (
      <div className="container-page py-16 md:py-section">
        <div className="py-12 text-center md:py-20">
          <p className="font-display text-display-3 text-ink italic">Ova soba se upravo uređuje.</p>
          <p className="mt-4 text-body text-ink-muted">Novi komadi stižu uskoro.</p>
        </div>
      </div>
    );
  }

  const featured = products.length >= FEATURE_FROM;
  // Istaknuti zauzima prva dva reda zajedno sa još četiri proizvoda; bez njega prekid ide posle prvog reda.
  const breakAt = Math.min(featured ? 5 : 4, products.length);
  const editorialItem = editorial ? (
    <li className="col-span-2 lg:col-span-4">
      <RoomEditorial editorial={editorial} />
    </li>
  ) : null;

  return (
    <section aria-label="Proizvodi" className="container-page pt-6 pb-16 md:pt-8 md:pb-section">
      <div className="mb-8 flex items-center justify-between gap-6 border-b border-hairline pb-2 md:mb-12">
        <p className="text-caption text-ink-muted">{formatCount(products.length, ["proizvod", "proizvoda", "proizvoda"])}</p>
        <SortMenu slug={slug} current={sort} />
      </div>

      <ul className={grid}>
        {products.map((product, index) => {
          const isFeatured = featured && index === 0;
          return (
            <Fragment key={product.id}>
              {index === breakAt ? editorialItem : null}
              <li className={isFeatured ? "col-span-2 lg:row-span-2" : undefined}>
                <ProductCard product={product} sizes={isFeatured ? "(min-width: 64rem) 50vw, 100vw" : undefined} />
              </li>
            </Fragment>
          );
        })}
        {breakAt === products.length ? editorialItem : null}
      </ul>
    </section>
  );
}

/** Dok se proizvodi učitavaju: ista traka i tonske površine u obliku kartica, bez skakanja sadržaja. */
export function RoomProductsSkeleton() {
  return (
    <div aria-hidden="true" className="container-page pt-6 pb-16 md:pt-8 md:pb-section">
      <div className="mb-8 h-[2.75rem] border-b border-hairline md:mb-12" />
      <ul className={grid}>
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex flex-col gap-4">
            <div className="aspect-[4/5] bg-surface-sunken" />
            <div className="h-4 w-2/3 bg-surface-sunken" />
            <div className="h-4 w-1/3 bg-surface-sunken" />
          </li>
        ))}
      </ul>
    </div>
  );
}