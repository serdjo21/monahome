import type { Metadata } from "next";

import { Wordmark } from "@/components/brand/logo";
import { socialLinks } from "@/config/navigation";

export const metadata: Metadata = {
  title: "Uskoro",
  description: "monahome — home collection. Prva kolekcija stiže uskoro.",
};

export default function ComingSoonPage() {
  return (
    <main data-theme="espreso" className="flex min-h-dvh flex-col">
      <div className="container-page flex h-20 items-center justify-center">
        <Wordmark className="h-7 w-auto text-ink" title="monahome" />
      </div>

      <div className="container-page flex flex-1 flex-col justify-center gap-8 py-20">
        <p className="eyebrow flex items-center gap-4 text-ink-muted after:h-px after:w-14 after:bg-hairline">
          Home collection
        </p>
        <h1 className="max-w-4xl font-display text-[3.5rem] leading-[0.92] tracking-[-0.02em] text-ink italic md:text-display-1 xl:text-display-hero">
          Uskoro.
        </h1>
        <p className="max-w-md text-body-lg text-ink-muted">
          Uređujemo prvu kolekciju: peškiri, pledovi i šolje koji pretvaraju svakodnevne trenutke u male rituale.
        </p>
      </div>

      <div className="container-page flex flex-wrap items-center justify-between gap-6 border-t border-hairline py-8">
        <ul className="flex gap-8">
          {socialLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="label text-ink underline decoration-1 underline-offset-[6px] transition-colors hover:text-ink-muted"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-caption text-ink-muted">© monahome</p>
      </div>
    </main>
  );
}