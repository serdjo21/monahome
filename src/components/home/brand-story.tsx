import { TextLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import type { BrandStoryContent } from "@/server/storefront/types";

/** Priča brenda: fotografija detalja i tri načela. Tekstovi i fotografija iz admina (Početna). */
export function BrandStory({ content }: { content: BrandStoryContent }) {
  return (
    <section aria-labelledby="pristup" className="border-y border-hairline bg-surface-raised py-16 md:py-section">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4 lg:col-start-2">
          <Media media={content.image} ratio="4/5" sizes="(min-width: 64rem) 33vw, 100vw" />
        </div>

        <div className="flex flex-col justify-center gap-10 lg:col-span-5 lg:col-start-7">
          <div className="flex flex-col gap-5">
            <p className="eyebrow text-ink-muted">{content.eyebrow}</p>
            <h2
              id="pristup"
              className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-balance text-ink md:text-display-2"
            >
              {content.title}
            </h2>
          </div>

          <dl className="flex flex-col border-b border-hairline">
            {content.principles.map((item) => (
              <div key={item.title} className="border-t border-hairline py-5">
                <dt className="font-display text-display-product text-ink">{item.title}</dt>
                <dd className="mt-1 text-body text-ink-muted">{item.text}</dd>
              </div>
            ))}
          </dl>

          {content.link ? (
            <TextLink href={content.link.href} className="self-start">
              {content.link.label}
            </TextLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}