import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader, Panel, StatusBadge, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatRsd } from "@/lib/format";
import { LOW_STOCK, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_SLUGS, PRODUCT_TABS } from "@/lib/product-admin";
import { countProductsByStatus, getRoomOptions, listProducts } from "@/server/admin/products";
import { requireRole } from "@/server/auth/guard";
import { mediaUrl } from "@/server/storefront/media";

export const metadata = { title: "Proizvodi" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

function href(status: string, query: string, room: string, page = 1) {
  const params = new URLSearchParams();
  if (status !== "svi") params.set("status", status);
  if (query) params.set("q", query);
  if (room) params.set("soba", room);
  if (page > 1) params.set("strana", String(page));
  const search = params.toString();
  return `/admin/proizvodi${search ? `?${search}` : ""}`;
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/proizvodi">) {
  await requireRole("ADMIN", "/admin/proizvodi");

  const params = await searchParams;
  const slug = typeof params.status === "string" && params.status in PRODUCT_STATUS_SLUGS ? params.status : "svi";
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const page = Math.max(1, Number(params.strana) || 1);
  const rooms = await getRoomOptions();
  const room = typeof params.soba === "string" && rooms.some((r) => r.id === params.soba) ? params.soba : "";

  const [{ products, total, pages }, counts] = await Promise.all([
    listProducts({ status: slug === "svi" ? null : PRODUCT_STATUS_SLUGS[slug], query, roomId: room || null, page }),
    countProductsByStatus(),
  ]);
  const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <AdminPageHeader
        title="Proizvodi"
        description="Novi proizvod je nacrt dok ga ne objavite. Lager se vodi po varijanti."
        actions={<LinkButton href="/admin/proizvodi/novi">Novi proizvod</LinkButton>}
      />

      <nav aria-label="Status proizvoda" className="-mx-5 mb-6 no-scrollbar overflow-x-auto px-5 md:mx-0 md:px-0">
        <ul className="flex gap-6 border-b border-hairline">
          {PRODUCT_TABS.map((tab) => {
            const active = tab.slug === slug;
            return (
              <li key={tab.slug}>
                <Link
                  href={href(tab.slug, query, room)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 py-3 text-body whitespace-nowrap transition-colors",
                    active ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                  <span className="text-caption text-ink-muted">{tab.status ? counts[tab.status] : allCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/admin/proizvodi" className="mb-6 flex max-w-2xl flex-wrap gap-3">
        {slug !== "svi" ? <input type="hidden" name="status" value={slug} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Naziv ili šifra"
          aria-label="Pretraga proizvoda"
          className="h-11 min-w-48 flex-1 border border-hairline bg-transparent px-4 text-[16px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-ink md:text-body"
        />
        <select
          name="soba"
          defaultValue={room}
          aria-label="Soba"
          className="h-11 border border-hairline bg-transparent px-3 text-[16px] text-ink outline-none focus:border-ink md:text-body"
        >
          <option value="">Sve sobe</option>
          {rooms.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="border border-ink px-5 label text-ink transition-colors hover:bg-ink hover:text-surface"
        >
          Traži
        </button>
      </form>

      <Panel>
        {products.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-body text-ink-muted">
              {query || room
                ? "Nijedan proizvod ne odgovara pretrazi."
                : allCount === 0
                  ? "Još nema proizvoda."
                  : "U ovom statusu nema proizvoda."}
            </p>
            {allCount === 0 ? (
              <Link
                href="/admin/proizvodi/novi"
                className="mt-3 inline-block text-caption text-ink underline underline-offset-4"
              >
                Dodajte prvi proizvod
              </Link>
            ) : query || room || slug !== "svi" ? (
              <Link
                href={href("svi", "", "")}
                className="mt-3 inline-block text-caption text-ink underline underline-offset-4"
              >
                Prikaži sve proizvode
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Proizvod</th>
                  <th className={`${thClass} hidden md:table-cell`}>Soba</th>
                  <th className={thClass}>Cena</th>
                  <th className={thClass}>Dostupno</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const src = mediaUrl(product.image?.path);
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-surface">
                      <td className={tdClass}>
                        <Link href={`/admin/proizvodi/${product.id}`} className="group flex items-center gap-4">
                          <span className="relative block h-15 w-12 shrink-0 overflow-hidden bg-surface-sunken">
                            {src ? (
                              <Image
                                src={src}
                                alt={product.image?.alt ?? product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block group-hover:underline">{product.name}</span>
                            {product.subtitle ? (
                              <span className="block text-caption text-ink-muted">{product.subtitle}</span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className={`${tdClass} hidden text-caption text-ink-muted md:table-cell`}>
                        {product.rooms.join(", ") || "—"}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {formatRsd(product.priceRsd)}
                        {product.compareAtRsd ? (
                          <span className="block text-caption text-ink-muted line-through">
                            {formatRsd(product.compareAtRsd)}
                          </span>
                        ) : null}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {product.variantCount === 0 ? (
                          <span className="text-caption text-ink-muted">Bez varijanti</span>
                        ) : (
                          <span
                            className={cn(
                              product.available === 0
                                ? "text-accent"
                                : product.available <= LOW_STOCK
                                  ? "text-ink"
                                  : "text-ink-muted",
                            )}
                          >
                            {product.available === 0 ? "Rasprodato" : `${product.available} kom.`}
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <StatusBadge status={product.status} label={PRODUCT_STATUS_LABEL[product.status]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {pages > 1 ? (
        <nav aria-label="Strane" className="mt-6 flex items-center justify-between text-caption text-ink-muted">
          <span>
            Strana {page} od {pages} · ukupno {total}
          </span>
          <div className="flex gap-5">
            {page > 1 ? (
              <Link href={href(slug, query, room, page - 1)} className="text-ink underline underline-offset-4">
                Prethodna
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={href(slug, query, room, page + 1)} className="text-ink underline underline-offset-4">
                Sledeća
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}