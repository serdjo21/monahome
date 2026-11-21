import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignDelete } from "@/components/admin/campaign-delete";
import { CampaignForm } from "@/components/admin/campaign-form";
import { CampaignProducts } from "@/components/admin/campaign-products";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { CAMPAIGN_PHASE_LABEL, campaignPhase } from "@/lib/campaign-admin";
import { toBelgradeDateInput } from "@/lib/dates";
import { duplicateCampaign, setCampaignImage } from "@/server/admin/campaign-actions";
import { findOverlapping, getAdminCampaign, getShownCampaignId } from "@/server/admin/campaigns";
import { requireRole } from "@/server/auth/guard";
import { mediaUrl } from "@/server/storefront/media";

export const metadata = { title: "Kampanja" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

const linkClass = "text-caption text-ink underline underline-offset-4 hover:text-ink-muted";

export default async function AdminCampaignPage({ params }: PageProps<"/admin/kampanje/[id]">) {
  const { id } = await params;
  await requireRole("ADMIN", `/admin/kampanje/${id}`);

  const now = new Date();
  const [campaign, shownId] = await Promise.all([getAdminCampaign(id), getShownCampaignId(now)]);
  if (!campaign) notFound();

  const isShown = shownId === campaign.id;
  const phase = campaignPhase(campaign, now);
  const overlapping =
    campaign.status === "SCHEDULED" && campaign.startsAt && campaign.endsAt
      ? await findOverlapping(campaign.id, campaign.startsAt, campaign.endsAt)
      : [];

  const status = isShown
    ? "Upravo se prikazuje na sajtu."
    : campaign.isDefault
      ? "Rezervna: prikazuje se kad nijedna zakazana ne traje."
      : CAMPAIGN_PHASE_LABEL[phase];

  return (
    <>
      <Link
        href="/admin/kampanje"
        className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Sve kampanje
      </Link>
      <AdminPageHeader title={campaign.name} description={status} />

      {overlapping.length > 0 ? (
        <p className="mb-8 max-w-5xl border border-accent px-5 py-4 text-caption text-ink">
          Period se preklapa sa: {overlapping.map((item) => item.name).join(", ")}. Dok se preklapaju, prikazuje se ona
          koja je kasnije počela.
        </p>
      ) : null}

      <div className="grid max-w-[90rem] gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-8">
          <Panel>
            <div className="py-2">
              <CampaignForm
                campaign={{
                  id: campaign.id,
                  slug: campaign.slug,
                  name: campaign.name,
                  status: campaign.status,
                  isDefault: campaign.isDefault,
                  startsAt: toBelgradeDateInput(campaign.startsAt),
                  endsAt: toBelgradeDateInput(campaign.endsAt),
                  season: campaign.season,
                  headline: campaign.headline,
                  intro: campaign.intro,
                  ctaLabel: campaign.ctaLabel,
                  ctaHref: campaign.ctaHref,
                  layout: campaign.layout,
                  theme: campaign.theme,
                  heroImageAlt: campaign.heroImageAlt,
                  focalX: campaign.focalX,
                  focalY: campaign.focalY,
                  editorialTitle: campaign.editorialTitle,
                  editorialText: campaign.editorialText,
                  editorialImageAlt: campaign.editorialImageAlt,
                  images: {
                    hero: mediaUrl(campaign.heroImagePath),
                    heroMobile: mediaUrl(campaign.heroImageMobilePath),
                    editorial: mediaUrl(campaign.editorialImagePath),
                  },
                }}
                saveImage={{
                  hero: setCampaignImage.bind(null, campaign.id, "heroImagePath"),
                  heroMobile: setCampaignImage.bind(null, campaign.id, "heroImageMobilePath"),
                  editorial: setCampaignImage.bind(null, campaign.id, "editorialImagePath"),
                }}
              />
            </div>
          </Panel>

          <Panel title="Proizvodi">
            <div className="py-2">
              <CampaignProducts
                campaignId={campaign.id}
                items={campaign.products.map(({ product }) => ({
                  id: product.id,
                  name: product.name,
                  status: product.status,
                  priceRsd: product.priceRsd,
                  src: mediaUrl(product.images[0]?.path),
                }))}
              />
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-8">
          <Panel title="Pregled">
            <div className="flex flex-col gap-3 py-2">
              <p className="text-caption text-ink-muted">
                Tajni linkovi: kampanja kao da je aktivna, i pre početka. Kupci ih ne vide; ne delite ih javno.
              </p>
              <Link href={`/pregled/${campaign.previewToken}`} target="_blank" className={linkClass}>
                Pregled početne
              </Link>
              <Link href={`/pregled/${campaign.previewToken}/kolekcija`} target="_blank" className={linkClass}>
                Pregled stranice kolekcije
              </Link>
            </div>
          </Panel>

          <Panel title="Dupliranje">
            <form action={duplicateCampaign} className="flex flex-col gap-3 py-2">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <p className="text-caption text-ink-muted">
                Kopija sa istim tekstovima, fotografijama i proizvodima, kao nacrt bez perioda. Zgodno za sledeću
                sezonu.
              </p>
              <button
                type="submit"
                className="self-start border border-ink px-4 py-2.5 label text-ink transition-colors hover:bg-ink hover:text-surface"
              >
                Dupliraj
              </button>
            </form>
          </Panel>

          <Panel title="Brisanje">
            <div className="py-2">
              <CampaignDelete
                campaignId={campaign.id}
                blockedReason={
                  campaign.isDefault
                    ? "Rezervna kampanja se ne može obrisati."
                    : isShown
                      ? "Kampanja se upravo prikazuje. Promenite joj status ili period, pa je obrišite."
                      : null
                }
              />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}