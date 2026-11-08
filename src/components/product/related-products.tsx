import { Carousel } from "@/components/home/carousel";
import { ProductCard } from "@/components/product/product-card";
import { getRelatedProducts } from "@/server/storefront";
import type { ProductDetail } from "@/server/storefront/types";

/** „Iz iste sobe“ ispod proizvoda; ne prikazuje se ako u sobi nema drugih proizvoda. */
export async function RelatedProducts({ product }: { product: ProductDetail }) {
  const products = await getRelatedProducts(product.id, product.room?.slug ?? null);
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="iz-iste-sobe" className="border-t border-hairline py-16 md:py-section">
      <Carousel
        headingId="iz-iste-sobe"
        title={product.room ? "Iz iste sobe" : "Možda vam se dopadne"}
        link={product.room ? { href: `/${product.room.slug}`, label: `Cela soba` } : undefined}
      >
        {products.map((item) => (
          <ProductCard key={item.id} product={item} sizes="(min-width: 64rem) 28vw, 70vw" />
        ))}
      </Carousel>
    </section>
  );
}