import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionView } from "@/components/collection/collection-view";
import { PreviewBar } from "@/components/collection/preview-bar";
import { getCampaignByPreviewToken } from "@/server/storefront";

export const metadata: Metadata = { title: "Pregled kolekcije", robots: { index: false, follow: false } };

// Pregled se uvek čita uživo iz baze (izmene u adminu se vide odmah, bez keša).
export const instant = false;

/** Stranica kolekcije pre objave (admin → Kampanje → Pregled stranice kolekcije). */
export default async function CampaignCollectionPreview({ params }: PageProps<"/pregled/[token]/kolekcija">) {
  const { token } = await params;
  const preview = await getCampaignByPreviewToken(token);
  if (!preview) notFound();

  return (
    <>
      <PreviewBar
        name={preview.name}
        adminHref={`/admin/kampanje/${preview.id}`}
        otherHref={`/pregled/${token}`}
        otherLabel="Početna"
      />
      <CollectionView campaign={preview.campaign} />
    </>
  );
}