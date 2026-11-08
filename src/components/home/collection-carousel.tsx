import { ProductCard } from "@/components/product/product-card";
import { getActiveCampaign } from "@/server/storefront";

import { Carousel } from "./carousel";

/** „Iz kolekcije“: proizvodi koje je admin izabrao u aktivnoj kampanji, tim redosledom. */
export async function CollectionCarousel() {
  const campaign = await getActiveCampaign();
  if (campaign.products.length === 0) return null;

  return (
    <section aria-labelledby="iz-kolekcije" className="py-16 md:py-section">
      <Carousel
        headingId="iz-kolekcije"
        eyebrow={campaign.season}
        title="Iz kolekcije"
        link={{ href: campaign.cta.href, label: "Cela kolekcija" }}
      >
        {campaign.products.map((product) => (
          <ProductCard key={product.id} product={product} sizes="(min-width: 64rem) 28vw, 70vw" />
        ))}
      </Carousel>
    </section>
  );
}