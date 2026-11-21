import { ProductCard } from "@/components/product/product-card";
import { getProductGrid } from "@/server/storefront";
import type { ProductGridContent } from "@/server/storefront/types";

import { SectionHeading } from "./section-heading";

/** Mreža proizvoda koja se puni sama; izvor (novo / najprodavanije) i tekstovi iz admina (Početna). */
export async function ProductGrid({ content }: { content: ProductGridContent }) {
  const products = await getProductGrid(content.source, 8);
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="mreza-proizvoda" className="py-16 md:py-section">
      <div className="container-page">
        <SectionHeading
          id="mreza-proizvoda"
          eyebrow={content.eyebrow}
          title={content.title}
          link={content.link ?? undefined}
        />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}