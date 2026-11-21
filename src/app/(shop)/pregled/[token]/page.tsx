import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PreviewBar, toPreviewLinks } from "@/components/collection/preview-bar";
import { HomeSections } from "@/components/home/home-sections";
import { getCampaignByPreviewToken } from "@/server/storefront";

export const metadata: Metadata = { title: "Pregled kampanje", robots: { index: false, follow: false } };

// Pregled se uvek čita uživo iz baze (izmene u adminu se vide odmah, bez keša).
export const instant = false;

/** Početna sa ovom kampanjom, kao da je aktivna (admin → Kampanje → Pregled početne). */
export default async function CampaignHomePreview({ params }: PageProps<"/pregled/[token]">) {
  const { token } = await params;
  const preview = await getCampaignByPreviewToken(token);
  if (!preview) notFound();

  return (
    <>
      <PreviewBar
        name={preview.name}
        adminHref={`/admin/kampanje/${preview.id}`}
        otherHref={`/pregled/${token}/kolekcija`}
        otherLabel="Stranica kolekcije"
      />
      <HomeSections campaign={toPreviewLinks(preview.campaign, token)} />
    </>
  );
}