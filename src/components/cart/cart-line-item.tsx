"use client";

import Link from "next/link";

import { Media } from "@/components/ui/media";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { removeFromCart, setCartQuantity } from "@/lib/cart/store";
import { MAX_LINE_QUANTITY } from "@/lib/cart/types";
import { formatRsd } from "@/lib/format";

import type { DisplayLine } from "./use-cart-lines";

/** Jedna stavka korpe: fotografija, naziv, varijanta, cena, količina i „Ukloni“. */
export function CartLineItem({ line, onNavigate }: { line: DisplayLine; onNavigate?: () => void }) {
  const href = `/proizvod/${line.productSlug}`;

  return (
    <li className="flex gap-4 border-b border-hairline py-5 md:gap-5">
      <Link href={href} onClick={onNavigate} tabIndex={-1} aria-hidden="true" className="w-20 shrink-0 md:w-24">
        <Media media={line.image} ratio="4/5" sizes="96px" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={href}
            onClick={onNavigate}
            className="font-display text-[1.125rem] leading-snug text-ink transition-colors hover:text-ink-muted"
          >
            {line.productName}
          </Link>
          <p className="text-body whitespace-nowrap text-ink">{formatRsd(line.unitPriceRsd * line.quantity)}</p>
        </div>
        {line.variantLabel ? <p className="text-caption text-ink-muted">{line.variantLabel}</p> : null}
        {line.quantity > 1 ? (
          <p className="text-caption text-ink-muted">{formatRsd(line.unitPriceRsd)} po komadu</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-3">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={Math.min(line.available, MAX_LINE_QUANTITY)}
            onChange={(quantity) => setCartQuantity(line.variantId, quantity)}
            label={line.productName}
          />
          <button
            type="button"
            onClick={() => removeFromCart([line.variantId])}
            className="text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Ukloni<span className="sr-only">: {line.productName}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

/** Tonske površine u obliku stavki dok stižu podaci sa servera. */
export function CartLinesSkeleton({ count = 2 }: { count?: number }) {
  return (
    <ul aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex gap-4 border-b border-hairline py-5 md:gap-5">
          <div className="aspect-[4/5] w-20 shrink-0 bg-surface-sunken md:w-24" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-4 w-2/3 bg-surface-sunken" />
            <div className="h-3 w-1/3 bg-surface-sunken" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Poruke o promenama (rasprodato, smanjena količina). */
export function CartNotices({ notices }: { notices: string[] }) {
  if (notices.length === 0) return null;
  return (
    <ul role="status" className="mt-4 flex flex-col gap-2 border-l-2 border-accent bg-surface-raised px-4 py-3">
      {notices.map((notice) => (
        <li key={notice} className="text-caption text-ink">
          {notice}
        </li>
      ))}
    </ul>
  );
}