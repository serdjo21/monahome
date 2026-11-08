import { Media } from "@/components/ui/media";
import { socialLinks } from "@/config/navigation";
import type { SocialContent } from "@/server/storefront/types";

/** Instagram i TikTok traka. Objave se biraju u adminu; kasnije i sadržaj partnera iz affiliate programa. */
export function Social({ content }: { content: SocialContent }) {
  return (
    <section aria-labelledby="drustvene-mreze" className="py-16 md:py-section">
      <div className="container-page mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
        <h2
          id="drustvene-mreze"
          className="font-display text-[2.25rem] leading-none text-ink italic md:text-display-2"
        >
          {content.handle}
        </h2>
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
      </div>

      <ul className="grid grid-cols-3 gap-1 md:grid-cols-6">
        {content.posts.map((post) => (
          <li key={post.id}>
            <a
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${post.image.alt} (otvara se u novom prozoru)`}
              className="block transition-opacity duration-500 hover:opacity-80"
            >
              <Media media={post.image} ratio="1/1" sizes="(min-width: 48rem) 17vw, 33vw" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}