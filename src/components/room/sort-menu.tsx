import Link from "next/link";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { RoomSort } from "@/server/storefront/types";

const options: { value: RoomSort; label: string }[] = [
  { value: "preporuceno", label: "Preporučeno" },
  { value: "najnovije", label: "Najnovije" },
  { value: "cena-rastuce", label: "Cena: od niže" },
  { value: "cena-opadajuce", label: "Cena: od više" },
];

/**
 * Sortiranje bez JavaScripta: <details> otvara listu, a svaka opcija je običan link (?sort=...).
 * `key` po trenutnom sortiranju ponovo montira element posle izbora, pa se lista sama zatvori.
 */
export function SortMenu({ slug, current }: { slug: string; current: RoomSort }) {
  const active = options.find((option) => option.value === current) ?? options[0];

  return (
    <details key={current} className="group relative">
      <summary className="label flex cursor-pointer list-none items-center gap-2 py-2 text-ink [&::-webkit-details-marker]:hidden">
        <span className="text-ink-muted">Sortiraj:</span>
        <span>{active.label}</span>
        <ChevronDownIcon
          width={14}
          height={14}
          aria-hidden="true"
          className="transition-transform duration-300 ease-editorial group-open:rotate-180"
        />
      </summary>

      <ul className="absolute top-full right-0 z-20 mt-2 min-w-56 border border-hairline bg-surface-raised py-2">
        {options.map((option) => {
          const isActive = option.value === current;
          return (
            <li key={option.value}>
              <Link
                href={option.value === "preporuceno" ? `/${slug}` : `/${slug}?sort=${option.value}`}
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "block px-5 py-2.5 text-body transition-colors hover:text-ink",
                  isActive ? "text-ink underline underline-offset-[6px]" : "text-ink-muted",
                )}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}