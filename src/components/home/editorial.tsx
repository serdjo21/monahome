import { TextLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { getActiveCampaign } from "@/server/storefront";

/** Editorijalni blok kampanje: fotografija preko cele širine, tekst ispod. */
export async function Editorial() {
  const campaign = await getActiveCampaign();
  const editorial = campaign.editorial;
  if (!editorial) return null;

  return (
    <section aria-labelledby="editorijal" className="pb-16 md:pb-section">      <div className="md:hidden">
        <Media media={editorial.image} ratio="4/5" sizes="100vw" />
      </div>
      <div className="hidden md:block">
        <Media media={editorial.image} ratio="16/7" sizes="100vw" />
      </div>

      <div className="container-page mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <p className="eyebrow text-ink-muted">{campaign.season}</p>
          <h2
            id="editorijal"
            className="font-display text-[2.75rem] leading-none tracking-[-0.015em] text-ink italic md:text-display-1"
          >
            {editorial.title}
          </h2>
        </div>
        <div className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-8 lg:pt-10">
          <p className="text-body-lg text-ink-muted">{editorial.text}</p>
          <TextLink href={editorial.href}>Pogledaj priču</TextLink>
        </div>
      </div>
    </section>
  );
}