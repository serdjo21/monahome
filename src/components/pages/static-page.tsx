import type { Metadata } from "next";

import { CONTACT } from "@/lib/contact";
import type { PageSlug } from "@/lib/pages";
import { getPage } from "@/server/storefront/pages";

import { RichText } from "./rich-text";

const dateFormat = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Belgrade",
});

export async function staticPageMetadata(slug: PageSlug): Promise<Metadata> {
  const page = await getPage(slug);
  return { title: page.title, description: page.seoDescription ?? page.intro ?? undefined };
}

/** Kontakt podaci kao veliki linkovi, samo na stranici „Kontakt“. */
function ContactCard() {
  const rows = [
    { label: "E-mail", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { label: "Telefon", value: CONTACT.phone, href: CONTACT.phoneHref },
    { label: "Instagram", value: "@monahome.rs", href: CONTACT.instagram },
  ];

  return (
    <dl className="mb-14 flex flex-col border-b border-hairline md:mb-16">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-1 border-t border-hairline py-5 sm:flex-row sm:items-baseline sm:gap-8"
        >
          <dt className="w-28 shrink-0 label text-ink-muted">{row.label}</dt>
          <dd>
            <a
              href={row.href}
              {...(row.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="font-display text-[1.75rem] leading-tight text-ink transition-colors hover:text-ink-muted md:text-display-3"
            >
              {row.value}
            </a>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Tekstualna stranica (O nama, Dostava, pravne stranice…): naslov, uvod i tekst iz admina,
 * u uskom stupcu za čitanje. Generiše se unapred; izmena u adminu je odmah osvežava.
 */
export async function StaticPage({ slug }: { slug: PageSlug }) {
  const page = await getPage(slug);

  return (
    <article aria-labelledby="naslov-stranice">
      <header className="border-b border-hairline">
        <div className="container-page flex flex-col gap-6 pt-16 pb-12 md:pt-24 md:pb-16">
          <h1
            id="naslov-stranice"
            className="max-w-4xl font-display text-[3rem] leading-[0.95] tracking-[-0.02em] text-balance text-ink italic md:text-display-1"
          >
            {page.title}
          </h1>
          {page.intro ? <p className="max-w-2xl text-body-lg text-ink-muted">{page.intro}</p> : null}
        </div>
      </header>

      <div className="container-page py-14 md:py-20">
        <div className="max-w-2xl lg:ml-[calc(100%/12*3)]">
          {slug === "kontakt" ? <ContactCard /> : null}
          <RichText source={page.body} />
          {page.updatedAt ? (
            <p className="mt-16 border-t border-hairline pt-5 text-caption text-ink-muted">
              Poslednja izmena: {dateFormat.format(page.updatedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}