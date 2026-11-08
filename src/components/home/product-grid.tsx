import { ProductCard } from "@/components/product/product-card";
import { getProductGrid } from "@/server/storefront";

import { SectionHeading } from "./section-heading";

const copy = {
  new: { eyebrow: "Upravo stiglo", title: "Novo", href: "/novo" },
  bestsellers: { eyebrow: "Omiljeno", title: "Najprodavanije", href: "/najprodavanije" },
} as const;

/** Mreža proizvoda koja se puni sama; izvor (novo / najprodavanije) bira se u adminu. */
export async function ProductGrid({ source }: { source: "new" | "bestsellers" }) {
  const products = await getProductGrid(source, 8);
  if (products.length === 0) return null;
  const text = copy[source];

  return (
    <section aria-labelledby="mreza-proizvoda" className="py-16 md:py-section">
      <div className="container-page">
        <SectionHeading
          id="mreza-proizvoda"
          eyebrow={text.eyebrow}
          title={text.title}
          link={{ href: text.href, label: "Pogledaj sve" }}
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