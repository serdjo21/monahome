import Link from "next/link";

import { LinkButton } from "@/components/ui/button";
import { getRooms } from "@/server/storefront";

/** 404 unutar prodavnice: sa headerom i futerom, i putevima nazad kroz sobe. */
export default async function ShopNotFound() {
  const rooms = await getRooms();

  return (
    <section data-theme="espreso" aria-labelledby="nije-pronadjeno" className="bg-surface">
      <div className="container-page flex min-h-[70vh] flex-col justify-end gap-10 py-20 md:py-28">
        <p className="eyebrow text-ink-muted">404</p>
        <h1
          id="nije-pronadjeno"
          className="max-w-4xl font-display text-[3.25rem] leading-[0.95] tracking-[-0.02em] text-balance text-ink italic md:text-display-1 xl:text-display-hero"
        >
          Ova soba još nije uređena.
        </h1>
        <p className="max-w-md text-body-lg text-ink-muted">Stranica koju tražite ne postoji ili je premeštena.</p>

        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
          <div>
            <LinkButton href="/">Na početnu</LinkButton>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {rooms.map((room) => (
              <li key={room.slug}>
                <Link
                  href={`/${room.slug}`}
                  className="text-body text-ink underline decoration-hairline underline-offset-[6px] transition-colors hover:decoration-ink"
                >
                  {room.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}