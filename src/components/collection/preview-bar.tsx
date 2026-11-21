import Link from "next/link";

import type { Campaign } from "@/server/storefront/types";

/** Traka na vrhu pregleda kampanje, da se pregled nikad ne pomeša sa pravim sajtom. */
export function PreviewBar({
  name,
  adminHref,
  otherHref,
  otherLabel,
}: {
  name: string;
  adminHref: string;
  otherHref: string;
  otherLabel: string;
}) {
  return (
    <div data-theme="espreso" className="bg-accent text-on-accent">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 text-caption">
        <p>
          Pregled kampanje <span className="font-medium">{name}</span>. Kupci ovo ne vide.
        </p>
        <div className="flex gap-5">
          <Link href={otherHref} className="underline underline-offset-4">
            {otherLabel}
          </Link>
          <Link href={adminHref} className="underline underline-offset-4">
            Nazad u admin
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Linkovi ka samoj kolekciji u pregledu vode na pregled kolekcije, jer prava još nije javna. */
export function toPreviewLinks(campaign: Campaign, token: string): Campaign {
  const own = `/kolekcija/${campaign.slug}`;
  const preview = `/pregled/${token}/kolekcija`;
  return {
    ...campaign,
    cta: { ...campaign.cta, href: campaign.cta.href === own ? preview : campaign.cta.href },
    editorial: campaign.editorial
      ? { ...campaign.editorial, href: campaign.editorial.href === own ? preview : campaign.editorial.href }
      : null,
  };
}