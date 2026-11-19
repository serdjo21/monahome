import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderNoteForm } from "@/components/admin/order-note-form";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { AdminPageHeader, Panel, StatusBadge, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { formatDateTime, ORDER_STATUS_LABEL } from "@/lib/admin-format";
import { formatOrderNumber, formatRsd } from "@/lib/format";
import { getAdminOrder } from "@/server/admin/orders";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Porudžbina" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

export default async function AdminOrderPage({ params }: PageProps<"/admin/porudzbine/[id]">) {
  const { id } = await params;
  await requireRole("ADMIN", `/admin/porudzbine/${id}`);

  const order = await getAdminOrder(id);
  if (!order) notFound();

  // Tok porudžbine iz datuma na samoj porudžbini (bez posebne tabele istorije).
  const timeline = [
    { label: "Primljena", at: order.createdAt },
    { label: "Potvrđena", at: order.confirmedAt },
    {
      label: "Poslata",
      at: order.shippedAt,
      detail: [order.courier, order.trackingNumber].filter(Boolean).join(" · ") || null,
    },
    { label: "Isporučena", at: order.deliveredAt },
    { label: "Otkazana", at: order.cancelledAt },
  ].filter((step) => step.at);

  return (
    <>
      <Link href="/admin/porudzbine" className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink">
        Sve porudžbine
      </Link>
      <AdminPageHeader
        title={formatOrderNumber(order.number)}
        description={`Primljena ${formatDateTime(order.createdAt)} · ${order.fullName}, ${order.city}`}
        actions={<StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />}
      />

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-8">
          <Panel title="Stavke">
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Proizvod</th>
                    <th className={`${thClass} hidden sm:table-cell`}>Šifra</th>
                    <th className={`${thClass} text-right`}>Kol.</th>
                    <th className={`${thClass} text-right`}>Iznos</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className={tdClass}>
                        <p>{item.productName}</p>
                        <p className="text-caption text-ink-muted">
                          {[item.variantLabel, `${formatRsd(item.unitPriceRsd)} po komadu`].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className={`${tdClass} hidden text-caption text-ink-muted sm:table-cell`}>{item.sku}</td>
                      <td className={`${tdClass} text-right`}>{item.quantity}</td>
                      <td className={`${tdClass} text-right whitespace-nowrap`}>{formatRsd(item.lineTotalRsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 ml-auto flex max-w-xs flex-col gap-2 text-body">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Međuzbir</dt>
                <dd>{formatRsd(order.subtotalRsd)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Dostava</dt>
                <dd className="text-ink-muted">{order.shippingRsd > 0 ? formatRsd(order.shippingRsd) : "Pri preuzimanju"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-hairline pt-3">
                <dt className="label text-ink">Ukupno</dt>
                <dd className="text-body-lg font-medium">{formatRsd(order.totalRsd)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Dostava">
            <div className="grid gap-6 py-2 sm:grid-cols-2">
              <div>
                <p className="label mb-2 text-ink-muted">Adresa</p>
                <p className="text-body text-ink">
                  {order.fullName}
                  <br />
                  {order.address}
                  <br />
                  {order.postalCode} {order.city}
                </p>
              </div>
              <div>
                <p className="label mb-2 text-ink-muted">Napomena kupca</p>
                <p className="text-body whitespace-pre-line text-ink">{order.note ?? "—"}</p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-8">
          <Panel title="Sledeći korak">
            <div className="py-2">
              <OrderStatusActions orderId={order.id} status={order.status} />
            </div>
          </Panel>

          <Panel title="Kupac">
            <div className="flex flex-col gap-3 py-2 text-body">
              <p className="text-ink">{order.fullName}</p>
              <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className="text-ink underline underline-offset-4">
                {order.phone}
              </a>
              <a href={`mailto:${order.email}`} className="break-all text-ink underline underline-offset-4">
                {order.email}
              </a>
            </div>
          </Panel>

          <Panel title="Tok porudžbine">
            <ol className="py-1">
              {timeline.map((step) => (
                <li key={step.label} className="flex justify-between gap-4 border-b border-hairline py-3 last:border-b-0">
                  <div>
                    <p className="text-body text-ink">{step.label}</p>
                    {step.detail ? <p className="text-caption text-ink-muted">{step.detail}</p> : null}
                  </div>
                  <p className="text-caption whitespace-nowrap text-ink-muted">{formatDateTime(step.at!)}</p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel>
            <div className="py-2">
              <OrderNoteForm orderId={order.id} note={order.internalNote} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}