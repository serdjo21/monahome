import { LinkButton } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import type { GiftsContent } from "@/server/storefront/types";

/** Sezonska sekcija za poklone. Sadržaj i uključivanje (pred praznike) iz admina. */
export function Gifts({ content }: { content: GiftsContent }) {
  return (
    <section data-theme="espreso" aria-labelledby="pokloni">
      <div className="grid lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Media media={content.image} ratio="1/1" sizes="(min-width: 64rem) 50vw, 100vw" />
        </div>
        <div className="flex flex-col justify-center gap-7 px-5 py-16 md:px-10 lg:col-span-5 lg:col-start-8 lg:px-0 lg:py-24">
          <p className="eyebrow text-ink-muted">{content.eyebrow}</p>
          <h2
            id="pokloni"
            className="font-display text-[2.75rem] leading-none tracking-[-0.015em] text-ink italic md:text-display-1"
          >
            {content.title}
          </h2>
          <p className="max-w-md text-body-lg text-ink-muted">{content.text}</p>
          <div className="mt-2">
            <LinkButton href={content.cta.href}>{content.cta.label}</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}