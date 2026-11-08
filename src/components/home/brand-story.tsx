import { TextLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";

const principles = [
  { title: "Prirodni materijali", text: "Pamuk, lan, vuna i glina. Ono što se oseća na dodir i stari lepo." },
  { title: "Tople nijanse", text: "Boje kamena, drveta i espresa, koje se slažu jedna uz drugu i uz vaš prostor." },
  { title: "Sezonske kolekcije", text: "Nekoliko pažljivo biranih komada svake sezone, umesto beskrajnog kataloga." },
];

/** Priča brenda: fotografija detalja i tri načela. Tekstovi prelaze u podešavanja sekcije u adminu. */
export function BrandStory() {
  return (
    <section aria-labelledby="pristup" className="border-y border-hairline bg-surface-raised py-16 md:py-section">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4 lg:col-start-2">
          <Media
            media={{ src: null, alt: "Krupni plan: tkanje lana, petlje pamuka i glazura šolje u jednom kadru" }}
            ratio="4/5"
            sizes="(min-width: 64rem) 33vw, 100vw"
          />
        </div>

        <div className="flex flex-col justify-center gap-10 lg:col-span-5 lg:col-start-7">
          <div className="flex flex-col gap-5">
            <p className="eyebrow text-ink-muted">Naš pristup</p>
            <h2
              id="pristup"
              className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-balance text-ink md:text-display-2"
            >
              Dom se gradi od sitnica koje koristite svaki dan.
            </h2>
          </div>

          <dl className="flex flex-col border-b border-hairline">
            {principles.map((item) => (
              <div key={item.title} className="border-t border-hairline py-5">
                <dt className="font-display text-display-product text-ink">{item.title}</dt>
                <dd className="mt-1 text-body text-ink-muted">{item.text}</dd>
              </div>
            ))}
          </dl>

          <TextLink href="/o-nama" className="self-start">
            O monahome
          </TextLink>
        </div>
      </div>
    </section>
  );
}