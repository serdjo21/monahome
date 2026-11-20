import Link from "next/link";
import { notFound } from "next/navigation";

import { type ColorOption, ProductImages } from "@/components/admin/product-images";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusActions } from "@/components/admin/product-status-actions";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { VariantEditor } from "@/components/admin/variant-editor";
import { formatDateTime } from "@/lib/admin-format";
import { PRODUCT_STATUS_LABEL } from "@/lib/product-admin";
import { getAdminProduct, getRoomOptions } from "@/server/admin/products";
import { requireRole } from "@/server/auth/guard";
import { mediaUrl } from "@/server/storefront/media";

export const metadata = { title: "Proizvod" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

export default async function AdminProductPage({ params }: PageProps<"/admin/proizvodi/[id]">) {
  const { id } = await params;
  await requireRole("ADMIN", `/admin/proizvodi/${id}`);

  const [product, rooms] = await Promise.all([getAdminProduct(id), getRoomOptions()]);
  if (!product) notFound();

  const activeVariants = product.variants.filter((variant) => variant.isActive).length;

  // Jedna stavka po boji (fotografija se vezuje za prvu varijantu te boje, kao na sajtu).
  const colors: ColorOption[] = [];
  for (const variant of product.variants) {
    if (variant.colorName && !colors.some((color) => color.name === variant.colorName)) {
      colors.push({ variantId: variant.id, name: variant.colorName, hex: variant.colorHex });
    }
  }

  return (
    <>
      <Link
        href="/admin/proizvodi"
        className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Svi proizvodi
      </Link>
      <AdminPageHeader
        title={product.name}
        description={product.subtitle ?? undefined}
        actions={<StatusBadge status={product.status} label={PRODUCT_STATUS_LABEL[product.status]} />}
      />

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-8">
          <Panel title="Varijante i lager">
            <div className="py-2">
              <VariantEditor
                productId={product.id}
                basePrice={product.priceRsd}
                variants={product.variants.map((variant) => ({
                  id: variant.id,
                  sku: variant.sku,
                  colorName: variant.colorName,
                  colorHex: variant.colorHex,
                  size: variant.size,
                  priceRsd: variant.priceRsd,
                  stock: variant.stock,
                  reserved: variant.reserved,
                  isActive: variant.isActive,
                  ordered: variant._count.orderItems > 0,
                }))}
              />
            </div>
          </Panel>

          <Panel title="Fotografije">
            <div className="py-2">
              <ProductImages
                productId={product.id}
                colors={colors}
                images={product.images.map((image) => ({
                  id: image.id,
                  src: mediaUrl(image.path),
                  alt: image.alt,
                  variantId: image.variantId,
                }))}
              />
            </div>
          </Panel>

          <Panel title="Podaci o proizvodu">
            <div className="py-2">
              <ProductForm
                rooms={rooms}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  subtitle: product.subtitle,
                  description: product.description,
                  care: product.care,
                  priceRsd: product.priceRsd,
                  compareAtRsd: product.compareAtRsd,
                  isNew: product.isNew,
                  roomIds: product.roomIds,
                }}
              />
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-8">
          <Panel title="Objava">
            <div className="py-2">
              <ProductStatusActions
                productId={product.id}
                slug={product.slug}
                status={product.status}
                activeVariants={activeVariants}
                imageCount={product.images.length}
                roomCount={product.roomIds.length}
              />
            </div>
          </Panel>

          <Panel title="Istorija">
            <dl className="flex flex-col py-1 text-caption">
              {[
                { label: "Napravljen", at: product.createdAt },
                { label: "Prvi put objavljen", at: product.publishedAt },
                { label: "Poslednja izmena", at: product.updatedAt },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4 border-b border-hairline py-3 last:border-b-0"
                >
                  <dt className="text-ink-muted">{row.label}</dt>
                  <dd className="text-ink">{row.at ? formatDateTime(row.at) : "—"}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}