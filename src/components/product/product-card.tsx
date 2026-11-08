import Link from "next/link";

import { Media } from "@/components/ui/media";
import { formatRsd } from "@/lib/format";
import type { ProductSummary } from "@/server/storefront/types";

type ProductCardProps = {
  product: ProductSummary;
  sizes?: string;
};

export function ProductCard({ product, sizes = "(min-width: 64rem) 25vw, 50vw" }: ProductCardProps) {
  const compareAt = product.compareAtRsd;
  const onSale = compareAt !== null && compareAt > product.priceRsd;
  const tag = onSale ? "Sezonska cena" : product.isNew ? "Novo" : null;

  return (
    <article className="group relative flex flex-col">
      <div className="relative">
        <Media media={product.image} ratio="4/5" sizes={sizes} />
        {product.hoverImage ? (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-editorial group-hover:opacity-100">
            <Media media={product.hoverImage} sizes={sizes} />
          </div>
        ) : null}
        {tag ? (
          <span className="absolute top-3 left-3 bg-accent px-2.5 py-1.5 label text-[0.6875rem] text-on-accent">
            {tag}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        {product.subtitle ? <p className="eyebrow text-[0.6875rem] text-ink-muted">{product.subtitle}</p> : null}
        <h3 className="font-display text-display-product text-ink">
          <Link href={`/proizvod/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-hairline pt-2.5">
          {product.colors.length > 0 ? (
            <ul className="flex gap-1.5" aria-label={`Boje: ${product.colors.map((c) => c.name).join(", ")}`}>
              {product.colors.slice(0, 4).map((color) => (
                <li
                  key={color.name}
                  className="size-2.5 rounded-full border border-hairline"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </ul>
          ) : (
            <span className="text-caption text-ink-muted">{product.meta}</span>
          )}

          <p className="flex items-baseline gap-2 text-body font-medium tracking-[0.02em] text-ink">
            {onSale && compareAt !== null ? (
              <>
                <span className="sr-only">Nova cena:</span>
                <span className="text-accent">{formatRsd(product.priceRsd)}</span>
                <span className="sr-only">Stara cena:</span>
                <s className="text-caption font-normal text-ink-muted">{formatRsd(compareAt)}</s>
              </>
            ) : (
              formatRsd(product.priceRsd)
            )}
          </p>
        </div>
      </div>
    </article>
  );
}