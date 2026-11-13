import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Editorial } from "@/components/home/editorial";
import { Hero } from "@/components/home/hero";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { formatCount } from "@/lib/format";
import { getActiveCampaign, getCampaign } from "@/server/storefront";

/** Unapred se generiše aktivna kolekcija; prethodne i buduće nisu javne. */
export async function generateStaticParams() {
  const campaign = await getActiveCampaign();
  return [{ slug: campaign.slug }];
}

export async function generateMetadata({ params }: PageProps<"/kolekcija/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return {};

  return {
    title: `${campaign.headline} · ${campaign.season}`,
    description: campaign.intro,
    openGraph: campaign.image.src ? { images: [{ url: campaign.image.src, alt: campaign.image.alt }] } : undefined,
  };
}

export default function CollectionPage({ params }: PageProps<"/kolekcija/[slug]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-[min(52rem,calc(100dvh-4rem))] bg-surface-sunken" />}>
      <CollectionContent params={params} />
    </Suspense>
  );
}

/** Stranica kolekcije: hero kampanje, editorijal i svi komadi koje je admin izabrao. */
async function CollectionContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  const hasProducts = campaign.products.length > 0;
  // Dugme u heroju na ovoj stranici vodi niz stranicu, do komada, a ne na samu kolekciju.
  const heroCampaign = hasProducts ? { ...campaign, cta: { label: "Pogledaj komade", href: "#komadi" } } : campaign;

  return (
    <>
      <Hero campaign={heroCampaign} />
      <Editorial campaign={campaign} showLink={false} />

      {hasProducts ? (
        <section id="komadi" aria-labelledby="komadi-naslov" className="scroll-mt-20 pb-16 md:pb-section xl:scroll-mt-32">
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