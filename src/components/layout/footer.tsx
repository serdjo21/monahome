import Link from "next/link";

import { Wordmark } from "@/components/brand/logo";
import { mainNav, socialLinks } from "@/config/navigation";

const rooms = mainNav.filter((link) => link.href !== "/kolekcija");

const help = [
  { href: "/dostava", label: "Dostava" },
  { href: "/reklamacije-i-povracaj", label: "Reklamacije i povraćaj" },
  { href: "/kontakt", label: "Kontakt" },
];

const brand = [
  { href: "/o-nama", label: "O nama" },
  { href: "/saradnja", label: "Saradnja" },
  { href: "/pokloni", label: "Pokloni" },
];

const legal = [
  { href: "/uslovi-koriscenja", label: "Uslovi korišćenja" },
  { href: "/privatnost", label: "Privatnost" },
  { href: "/kolacici", label: "Kolačići" },
];

const linkClass = "text-body text-ink transition-colors hover:text-ink-muted";

export function Footer() {
  return (
    <footer data-theme="espreso" className="bg-espreso-duboki">
      <div className="container-page grid gap-14 py-20 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <Link href="/" aria-label="monahome, početna" className="inline-block text-ink">
            <Wordmark className="h-7 w-auto" aria-hidden="true" />
          </Link>
          <p className="mt-6 max-w-xs text-body text-ink-muted">
            Peškiri, pledovi i šolje koji pretvaraju svakodnevne trenutke u male rituale.
          </p>
        </div>

        <FooterColumn title="Sobe" className="md:col-span-2 md:col-start-6">
          {rooms.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Pomoć" className="md:col-span-2">
          {help.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Brend" className="md:col-span-2">
          {brand.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
          {socialLinks.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-hairline">
        <div className="container-page flex flex-col gap-4 py-6 text-caption text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>© monahome</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h2 className="eyebrow text-ink-muted">{title}</h2>
      <ul className="mt-6 flex flex-col gap-3">{children}</ul>
    </div>
  );
}