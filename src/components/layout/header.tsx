import Link from "next/link";

import { Wordmark } from "@/components/brand/logo";
import { BagIcon, UserIcon } from "@/components/ui/icons";
import { getMainNav } from "@/server/storefront";

import { MobileMenu } from "./mobile-menu";

const iconButton = "inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-ink-muted";
const textLink =
  "label relative inline-block py-1.5 text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-editorial hover:after:scale-x-100";

/**
 * Zaglavlje: nalog i korpa levo, logo u sredini, pretraga (desktop) ili meni (telefon) desno.
 * Na xl+ ekranima ispod logoa ide red sa navigacijom; na užim je ona u meniju.
 * Navigacija (kolekcija + sobe) dolazi iz baze preko getMainNav().
 */
export async function Header() {
  const nav = await getMainNav();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface">
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center xl:h-[4.5rem]">
        <div className="flex items-center">
          {/* Telefon i tablet: ikonice */}
          <div className="-ml-2.5 flex items-center xl:hidden">
            <Link href="/nalog" aria-label="Nalog" className={iconButton}>
              <UserIcon />
            </Link>
            <Link href="/korpa" aria-label="Korpa" className={iconButton}>
              <BagIcon />
            </Link>
          </div>
          {/* Desktop: reči umesto ikonica */}
          <div className="hidden items-center gap-8 xl:flex">
            <Link href="/nalog" className={textLink}>
              Nalog
            </Link>
            <Link href="/korpa" className={textLink}>
              Korpa (0)
            </Link>
          </div>
        </div>

        <Link href="/" aria-label="monahome, početna" className="block text-ink">
          <Wordmark className="h-5 w-auto sm:h-6 xl:h-7" aria-hidden="true" />
        </Link>

        <div className="flex items-center justify-end">
          <div className="hidden xl:block">
            <Link href="/pretraga" className={textLink}>
              Pretraga
            </Link>
          </div>
          <MobileMenu links={nav} />
        </div>
      </div>

      <nav aria-label="Glavni meni" className="hidden xl:block">
        <ul className="container-page flex h-11 items-start justify-center gap-10">
          {nav.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={textLink}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}