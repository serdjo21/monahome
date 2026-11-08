import Link from "next/link";

import type { ProductDetail } from "@/server/storefront/types";

/** Putanja, naziv i podnaslov proizvoda. */
export function ProductHeader({ product }: { product: ProductDetail }) {
  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Putanja">
        <ol className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              Početna
            </Link>
          </li>
          {product.room ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/${product.room.slug}`} className="transition-colors hover:text-ink">
                  {product.room.name}
                </Link>
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.015em] text-balance text-ink md:text-display-2">
          {product.name}
        </h1>
        {product.subtitle ? <p className="eyebrow text-ink-muted">{product.subtitle}</p> : null}
      </div>
    </div>
  );
}