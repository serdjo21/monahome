import type { CampaignStatus, HeroLayout } from "@/generated/prisma/enums";

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Nacrt",
  SCHEDULED: "Zakazana",
  ARCHIVED: "Arhivirana",
};

export const HERO_LAYOUTS: { value: HeroLayout; label: string; note: string }[] = [
  {
    value: "SPLIT",
    label: "Tekst i fotografija",
    note: "Tekst levo, fotografija desno. Bez fotografije: blok u boji.",
  },
  { value: "FULL_BLEED", label: "Fotografija preko cele širine", note: "Fotografija gore, tekst u traci ispod." },
  { value: "OVERLAY", label: "Tekst preko fotografije", note: "Fotografija ispunjava hero, tekst stoji preko nje." },
];

/** Stanje kampanje u ovom trenutku, za oznaku u listi (status iz baze + period). */
export type CampaignPhase = "live" | "upcoming" | "ended" | "draft" | "archived";

export const CAMPAIGN_PHASE_LABEL: Record<CampaignPhase, string> = {
  live: "Aktivna sada",
  upcoming: "Zakazana",
  ended: "Završena",
  draft: "Nacrt",
  archived: "Arhivirana",
};

export function campaignPhase(
  campaign: { status: CampaignStatus; startsAt: Date | null; endsAt: Date | null },
  now: Date,
): CampaignPhase {
  if (campaign.status === "ARCHIVED") return "archived";
  if (campaign.status === "DRAFT") return "draft";
  if (!campaign.startsAt || !campaign.endsAt) return "draft";
  if (campaign.startsAt > now) return "upcoming";
  if (campaign.endsAt < now) return "ended";
  return "live";
}