import Link from "next/link";

import { AdminPageHeader, Panel, Stat, StatusBadge, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { formatDateTime, ORDER_STATUS_LABEL } from "@/lib/admin-format";
import { formatCount, formatOrderNumber, formatRsd } from "@/lib/format";
import { getDashboard } from "@/server/admin/dashboard";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Pregled" };

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  const { newOrders, today, month, recentOrders, lowStock } = await getDashboard();

  return (
    <>
      <AdminPageHeader title="Pregled" description="Šta se dešava u prodavnici danas." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Nove porudžbine" value={String(newOrders)} note={newOrders > 0 ? "Čekaju potvrdu" : "Sve je potvrđeno"} />
        <Stat label="Danas" value={formatRsd(today.total)} note={formatCount(today.count, ["porudžbina", "porudžbine", "porudžbina"])} />
        <Stat label="Ovog meseca" value={formatRsd(month.total)} note={formatCount(month.count, ["porudžbina", "porudžbine", "porudžbina"])} />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[3fr_2fr]">
        <Panel title="Poslednje porudžbine">
          {recentOrders.length === 0 ? (
            <p className="py-6 text-body text-ink-muted">Još nema porudžbina.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Broj</th>
                    <th className={thClass}>Kupac</th>
                    <th className={thClass}>Iznos</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Vreme</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className={tdClass}>{formatOrderNumber(order.number)}</td>
                      <td className={tdClass}>{order.fullName}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>{formatRsd(order.totalRsd)}</td>
                      <td className={tdClass}>
                        <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-ink-muted`}>{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Malo na lageru">
          {lowStock.length === 0 ? (
            <p className="py-6 text-body text-ink-muted">Svega ima dovoljno.</p>
          ) : (
            <ul>
              {lowStock.map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-4 border-b border-hairline py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-body text-ink">{variant.product.name}</p>
                    <p className="text-caption text-ink-muted">
                      {[variant.colorName, variant.size, variant.sku].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className={variant.available === 0 ? "text-body whitespace-nowrap text-accent" : "text-body whitespace-nowrap text-ink"}>
                    {variant.available === 0 ? "Rasprodato" : `${variant.available} kom.`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}