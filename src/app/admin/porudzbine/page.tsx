import Link from "next/link";

import { AdminPageHeader, Panel, StatusBadge, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { formatDateTime, ORDER_STATUS_LABEL } from "@/lib/admin-format";
import { cn } from "@/lib/cn";
import { formatOrderNumber, formatRsd } from "@/lib/format";
import { STATUS_SLUGS, STATUS_TABS } from "@/lib/order-status";
import { countOrdersByStatus, listOrders } from "@/server/admin/orders";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Porudžbine" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

function href(status: string, query: string, page = 1) {
  const params = new URLSearchParams();
  if (status !== "nove") params.set("status", status);
  if (query) params.set("q", query);
  if (page > 1) params.set("strana", String(page));
  const search = params.toString();
  return `/admin/porudzbine${search ? `?${search}` : ""}`;
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/porudzbine">) {
  await requireRole("ADMIN", "/admin/porudzbine");

  const params = await searchParams;
  const slug = typeof params.status === "string" && (params.status in STATUS_SLUGS || params.status === "sve") ? params.status : "nove";
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const page = Math.max(1, Number(params.strana) || 1);
  const status = slug === "sve" ? null : STATUS_SLUGS[slug];

  const [{ orders, total, pages }, counts] = await Promise.all([
    listOrders({ status, query, page }),
    countOrdersByStatus(),
  ]);
  const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <AdminPageHeader title="Porudžbine" description="Nove porudžbine potvrdite telefonom, pa ih označite kao poslate." />

      <nav aria-label="Status porudžbina" className="no-scrollbar -mx-5 mb-6 overflow-x-auto px-5 md:mx-0 md:px-0">
        <ul className="flex gap-6 border-b border-hairline">
          {STATUS_TABS.map((tab) => {
            const active = tab.slug === slug;
            const count = tab.status ? counts[tab.status] : allCount;
            return (
              <li key={tab.slug}>
                <Link
                  href={href(tab.slug, query)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 py-3 text-body whitespace-nowrap transition-colors",
                    active ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                  <span className={cn("text-caption", tab.status === "NEW" && count > 0 ? "text-accent" : "text-ink-muted")}>
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/admin/porudzbine" className="mb-6 flex max-w-xl gap-3">
        {slug !== "nove" ? <input type="hidden" name="status" value={slug} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Broj, ime, mejl, telefon ili mesto"
          aria-label="Pretraga porudžbina"
          className="h-11 flex-1 border border-hairline bg-transparent px-4 text-[16px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-ink md:text-body"
        />
        <button type="submit" className="label border border-ink px-5 text-ink transition-colors hover:bg-ink hover:text-surface">
          Traži
        </button>
      </form>

      <Panel>
        {orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-body text-ink-muted">
              {query ? "Nijedna porudžbina ne odgovara pretrazi." : "U ovom statusu trenutno nema porudžbina."}
            </p>
            {query || slug !== "sve" ? (
              <Link href={href("sve", "")} className="mt-3 inline-block text-caption text-ink underline underline-offset-4">
                Prikaži sve porudžbine
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Broj</th>
                  <th className={thClass}>Kupac</th>
                  <th className={`${thClass} hidden md:table-cell`}>Mesto</th>
                  <th className={thClass}>Iznos</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} hidden md:table-cell`}>Primljena</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface">
                    <td className={tdClass}>
                      <Link href={`/admin/porudzbine/${order.id}`} className="whitespace-nowrap underline-offset-4 hover:underline">
                        {formatOrderNumber(order.number)}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      <Link href={`/admin/porudzbine/${order.id}`} className="hover:underline">
                        {order.fullName}
                      </Link>
                    </td>
                    <td className={`${tdClass} hidden text-ink-muted md:table-cell`}>{order.city}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatRsd(order.totalRsd)}</td>
                    <td className={tdClass}>
                      <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
                    </td>
                    <td className={`${tdClass} hidden whitespace-nowrap text-ink-muted md:table-cell`}>
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
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
              <Link href={href(slug, query, page - 1)} className="text-ink underline underline-offset-4">
                Prethodna
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={href(slug, query, page + 1)} className="text-ink underline underline-offset-4">
                Sledeća
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}