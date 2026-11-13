import { LinkButton } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { getActiveCampaign } from "@/server/storefront";
import type { Campaign } from "@/server/storefront/types";

/** Prvi ekran početne. Ceo sadržaj dolazi iz aktivne kampanje (admin → Kampanje). */
/**
 * Prvi ekran početne. Ceo sadržaj dolazi iz aktivne kampanje (admin → Kampanje).
 * Stranica kolekcije prosleđuje svoju kampanju.
 */
export async function Hero({ campaign: provided }: { campaign?: Campaign }) {
  const campaign = provided ?? (await getActiveCampaign());
  switch (campaign.layout) {
    case "overlay":
      return <OverlayHero campaign={campaign} />;
    case "full-bleed":
      return <FullBleedHero campaign={campaign} />;
    default:
      return <SplitHero campaign={campaign} />;
  }
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-4 eyebrow text-ink-muted after:h-px after:w-14 after:bg-hairline">{children}</p>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h1
      id="hero-naslov"
      className="font-display text-[3.25rem] leading-[0.95] tracking-[-0.02em] text-balance text-ink italic md:text-display-1 xl:text-display-hero"
    >
      {children}
    </h1>
  );
}

function SplitHero({ campaign }: { campaign: Campaign }) {
  return (
    <section data-theme={campaign.theme} aria-labelledby="hero-naslov" className="overflow-hidden">
      <div className="grid lg:min-h-[min(52rem,calc(100dvh-4rem))] lg:grid-cols-12 xl:min-h-[min(52rem,calc(100dvh-7.25rem))]">
        <div className="order-2 flex flex-col justify-end gap-7 px-5 pt-10 pb-14 md:px-10 lg:order-1 lg:col-span-5 lg:py-24 lg:pr-6 lg:pl-10 xl:pl-[var(--spacing-gutter)]">
          <Eyebrow>{campaign.season}</Eyebrow>
          <Headline>{campaign.headline}</Headline>
          <p className="max-w-[26rem] text-body-lg text-ink-muted">{campaign.intro}</p>
          <div className="mt-2">
            <LinkButton href={campaign.cta.href}>{campaign.cta.label}</LinkButton>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7">
          <div className="h-full lg:hidden">
            <Media media={campaign.imageMobile ?? campaign.image} ratio="4/5" sizes="100vw" preload />
          </div>
          <div className="hidden h-full lg:block">
            <Media media={campaign.image} sizes="60vw" preload />
          </div>
        </div>
      </div>
    </section>
  );
}

function FullBleedHero({ campaign }: { campaign: Campaign }) {
  return (
    <section data-theme={campaign.theme} aria-labelledby="hero-naslov">
      <div className="lg:hidden">
        <Media media={campaign.imageMobile ?? campaign.image} ratio="4/5" sizes="100vw" preload />
      </div>
      <div className="hidden lg:block">
        <Media media={campaign.image} ratio="21/9" sizes="100vw" preload />
      </div>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Eyebrow>{campaign.season}</Eyebrow>
          <Headline>{campaign.headline}</Headline>
        </div>
        <div className="flex flex-col items-start justify-end gap-7 lg:col-span-4 lg:col-start-9">
          <p className="text-body-lg text-ink-muted">{campaign.intro}</p>
          <LinkButton href={campaign.cta.href}>{campaign.cta.label}</LinkButton>
        </div>
      </div>
    </section>
  );
}

/**
 * Fotografija preko celog heroja, tekst preko nje. Zatamnjenje je najjače tamo gde stoji tekst
 * (dole levo), da tekst ostane čitljiv i preko svetle fotografije.
 */
function OverlayHero({ campaign }: { campaign: Campaign }) {
  return (
    <section data-theme="espreso" aria-labelledby="hero-naslov" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <div className="h-full lg:hidden">
          <Media media={campaign.imageMobile ?? campaign.image} sizes="100vw" preload />
        </div>
        <div className="hidden h-full lg:block">
          <Media media={campaign.image} sizes="100vw" preload />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-espreso/90 via-espreso/60 to-espreso/20 lg:bg-linear-to-r lg:from-espreso/85 lg:via-espreso/50 lg:to-espreso/0"
      />

      <div className="container-page flex min-h-[min(46rem,calc(100dvh-4rem))] items-end py-14 lg:min-h-[min(52rem,calc(100dvh-4rem))] lg:py-24 xl:min-h-[min(52rem,calc(100dvh-7.25rem))]">
        <div className="flex max-w-xl flex-col gap-7">
          <p className="flex items-center gap-4 eyebrow text-ink/80 after:h-px after:w-14 after:bg-ink/50">
            {campaign.season}
          </p>
          <Headline>{campaign.headline}</Headline>
          <p className="max-w-[26rem] text-body-lg text-ink/85">{campaign.intro}</p>
          <div className="mt-2">
            <LinkButton href={campaign.cta.href}>{campaign.cta.label}</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}