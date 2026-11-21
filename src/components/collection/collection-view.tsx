import { Editorial } from "@/components/home/editorial";
import { Hero } from "@/components/home/hero";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { formatCount } from "@/lib/format";
import type { Campaign } from "@/server/storefront/types";

/** Sadržaj stranice kolekcije: hero kampanje, editorijal i svi komadi. Koristi ga i pregled kampanje. */
export function CollectionView({ campaign }: { campaign: Campaign }) {
  const hasProducts = campaign.products.length > 0;
  // Dugme u heroju na ovoj stranici vodi niz stranicu, do komada, a ne na samu kolekciju.
  const heroCampaign = hasProducts ? { ...campaign, cta: { label: "Pogledaj komade", href: "#komadi" } } : campaign;

  return (
    <>
      <Hero campaign={heroCampaign} />
      <Editorial campaign={campaign} showLink={false} />

      {hasProducts ? (
        <section
          id="komadi"
          aria-labelledby="komadi-naslov"
          className="scroll-mt-20 pb-16 md:pb-section xl:scroll-mt-32"
        >
          <div className="container-page">
            <SectionHeading id="komadi-naslov" eyebrow={campaign.season} title="Iz kolekcije">
              <p className="text-caption text-ink-muted">
                {formatCount(campaign.products.length, ["komad", "komada", "komada"])}
              </p>
            </SectionHeading>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
              {campaign.products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}