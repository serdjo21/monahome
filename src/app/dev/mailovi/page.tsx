import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EMAIL_PREVIEWS } from "@/emails/previews";

export const metadata: Metadata = { title: "Pregled mejlova", robots: { index: false } };

/**
 * Pregled svih mejlova sa probnim podacima, bez slanja: izmeni šablon u src/emails/ i osveži stranicu.
 * Samo u lokalnom razvoju; na Vercelu ova stranica ne postoji.
 */
export default function EmailPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="eyebrow text-ink-muted">Samo u razvoju</p>
      <h1 className="mt-3 font-display text-display-2 text-ink">Pregled mejlova</h1>
      <p className="mt-4 text-body text-ink-muted">
        Šabloni su u <code>src/emails/</code>. Izmeni, sačuvaj i osveži stranicu mejla. Za prikaz na telefonu uključi
        mobilni prikaz u DevTools.
      </p>
      <ul className="mt-10 border-t border-hairline">
        {Object.entries(EMAIL_PREVIEWS).map(([slug, preview]) => (
          <li key={slug} className="border-b border-hairline">
            <a href={`/dev/mailovi/${slug}`} target="_blank" className="flex flex-col gap-1 py-5 hover:opacity-70">
              <span className="text-body-lg text-ink">{preview.title}</span>
              <span className="text-caption text-ink-muted">Naslov: {preview.subject}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}