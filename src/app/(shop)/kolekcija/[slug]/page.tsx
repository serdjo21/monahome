import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CollectionView } from "@/components/collection/collection-view";
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

/**
 * Stranica kolekcije: hero kampanje, editorijal i svi komadi koje je admin izabrao.
 * Sadržaj je u Suspense-u: kolekcija koja je postala aktivna posle builda (zakazana iz admina)
 * nije među unapred generisanim stranicama, pa se renderuje pri prvoj poseti bez blokiranja.
 */
export default function CollectionPage({ params }: PageProps<"/kolekcija/[slug]">) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <CollectionContent params={params} />
    </Suspense>
  );
}

async function CollectionContent({ params }: { params: PageProps<"/kolekcija/[slug]">["params"] }) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  return <CollectionView campaign={campaign} />;
}

function CollectionSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-[min(46rem,calc(100dvh-4rem))] animate-pulse bg-surface-sunken" />
      <div className="container-page grid grid-cols-2 gap-x-4 gap-y-12 py-16 md:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse bg-surface-sunken" />
        ))}
      </div>
    </div>
  );
}