import Link from "next/link";

import { LinkButton } from "@/components/ui/button";
import { formatRsd } from "@/lib/format";

type CartSummaryProps = {
  subtotal: number;
  /** Zatvara panel pri prelasku na drugu stranicu. */
  onNavigate?: () => void;
  /** U panelu postoji i link ka punoj stranici korpe. */
  showCartLink?: boolean;
};

/** Međuzbir i prelazak na plaćanje. Dostava se dodaje kad se utvrde cene kurira. */
export function CartSummary({ subtotal, onNavigate, showCartLink = false }: CartSummaryProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <span className="label text-ink">Međuzbir</span>
          <span className="text-body-lg font-medium text-ink">{formatRsd(subtotal)}</span>
        </div>
        <p className="text-caption text-ink-muted">Dostava se obračunava pri plaćanju. Plaćanje pouzećem.</p>
      </div>

      <LinkButton href="/placanje" onClick={onNavigate} className="w-full">
        Nastavi na plaćanje
      </LinkButton>

      {showCartLink ? (
        <Link
          href="/korpa"
          onClick={onNavigate}
          className="self-center text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Pogledaj korpu
        </Link>
      ) : null}
    </div>
  );
}