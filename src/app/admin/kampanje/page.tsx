import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader, Panel, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/admin-format";
import { CAMPAIGN_PHASE_LABEL, campaignPhase, type CampaignPhase } from "@/lib/campaign-admin";
import { cn } from "@/lib/cn";
import { getShownCampaignId, listCampaigns } from "@/server/admin/campaigns";
import { requireRole } from "@/server/auth/guard";
import { mediaUrl } from "@/server/storefront/media";

export const metadata = { title: "Kampanje" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

const PHASE_TONE: Record<CampaignPhase, string> = {
  live: "bg-ink text-surface",
  upcoming: "border border-ink text-ink",
  ended: "border border-hairline text-ink-muted",
  draft: "border border-hairline text-ink-muted",
  archived: "border border-hairline text-ink-muted line-through",
};

const badge = "inline-flex h-6 items-center px-2 text-[0.6875rem] tracking-[0.08em] uppercase whitespace-nowrap";

export default async function AdminCampaignsPage() {
  await requireRole("ADMIN", "/admin/kampanje");
  const now = new Date();
  const [campaigns, shownId] = await Promise.all([listCampaigns(), getShownCampaignId(now)]);

  return (
    <>
      <AdminPageHeader
        title="Kampanje"
        description="Kampanja pokreće hero, karusel i editorijal na početnoj i stranicu kolekcije. Zakazana se pojavljuje sama."
        actions={<LinkButton href="/admin/kampanje/nova">Nova kampanja</LinkButton>}
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Kampanja</th>
                <th className={thClass}>Period</th>
                <th className={`${thClass} hidden md:table-cell`}>Proizvodi</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const phase = campaignPhase(campaign, now);
                const src = mediaUrl(campaign.heroImagePath);
                return (
                  <tr key={campaign.id} className="transition-colors hover:bg-surface">
                    <td className={tdClass}>
                      <Link href={`/admin/kampanje/${campaign.id}`} className="group flex items-center gap-4">
                        <span className="relative block h-12 w-20 shrink-0 overflow-hidden bg-surface-sunken">
                          {src ? <Image src={src} alt="" fill sizes="80px" className="object-cover" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block group-hover:underline">{campaign.name}</span>
                          <span className="block text-caption text-ink-muted">{campaign.season}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={`${tdClass} text-caption whitespace-nowrap text-ink-muted`}>
                      {campaign.startsAt && campaign.endsAt
                        ? `${formatDate(campaign.startsAt)} – ${formatDate(campaign.endsAt)}`
                        : "—"}
                    </td>
                    <td className={`${tdClass} hidden text-ink-muted md:table-cell`}>{campaign._count.products}</td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-2">
                        {campaign.id === shownId ? (
                          <span className={cn(badge, "bg-accent text-on-accent")}>Na sajtu</span>
                        ) : null}
                        {campaign.isDefault ? (
                          <span className={cn(badge, "border border-ink text-ink")}>Rezervna</span>
                        ) : (
                          <span className={cn(badge, PHASE_TONE[phase])}>{CAMPAIGN_PHASE_LABEL[phase]}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}