import { SITE_URL } from "@/lib/site";
import type { ProductDetail } from "@/server/storefront/types";

/**
 * Strukturirani podaci za Google (schema.org Product): cena u RSD i dostupnost
 * mogu da se pojave direktno u rezultatima pretrage.
 */
export function ProductJsonLd({ product }: { product: ProductDetail }) {
  const url = `${SITE_URL}/proizvod/${product.slug}`;
  const images = product.images.flatMap((image) => (image.src ? [image.src] : []));

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.subtitle ?? undefined,
    image: images.length > 0 ? images : undefined,
    brand: { "@type": "Brand", name: "monahome" },
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      sku: variant.sku,
      url,
      price: variant.priceRsd,
      priceCurrency: "RSD",
      availability: variant.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    })),
  };

  return (
    <script
      type="application/ld+json"
      // `<` se escapuje da tekst iz baze ne može da zatvori <script> tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}