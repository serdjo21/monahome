import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TextLink } from "@/components/ui/button";
import { formatOrderNumber, formatRsd } from "@/lib/format";
import { getOrderByToken } from "@/server/orders";

export const metadata: Metadata = {
  title: "Porudžbina primljena",
  robots: { index: false },
};

/** „Hvala“ posle porudžbine. Link sadrži tajni token, pa stranicu vidi samo kupac. */
export default function OrderPage({ params }: PageProps<"/porudzbina/[token]">) {
  return (
    <div className="container-page py-12 md:py-20">
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <OrderConfirmation params={params} />
      </Suspense>
    </div>
  );
}

async function OrderConfirmation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-6">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <p className="eyebrow text-ink-muted">Porudžbina {formatOrderNumber(order.number)}</p>
        <h1 className="font-display text-[3.25rem] leading-[0.95] tracking-[-0.02em] text-ink italic md:text-display-1">
          Hvala vam.
        </h1>
        <p className="max-w-md text-body-lg text-ink-muted">
          Porudžbina je primljena. Potvrdu smo poslali na <span className="text-ink">{order.email}</span>, a javićemo
          vam se kada pošiljka krene.
        </p>
        <div>
          <TextLink href="/">Nazad u prodavnicu</TextLink>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:col-span-5 lg:col-start-8">
        <div className="bg-surface-raised p-6 md:p-8">
          <h2 className="label mb-4 text-ink">Stavke</h2>
          <ul className="border-b border-hairline">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 border-t border-hairline py-4">
                <div>
                  <p className="text-body text-ink">{item.productName}</p>
                  <p className="text-caption text-ink-muted">
                    {[item.variantLabel, `× ${item.quantity}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-body whitespace-nowrap text-ink">{formatRsd(item.lineTotalRsd)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-2 text-body">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Dostava</dt>
              <dd className="text-ink-muted">{order.shippingRsd > 0 ? formatRsd(order.shippingRsd) : "Pri preuzimanju"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="label text-ink">Ukupno</dt>
              <dd className="text-body-lg font-medium text-ink">{formatRsd(order.totalRsd)}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="label mb-3 text-ink-muted">Dostava na adresu</h2>
            <p className="text-body text-ink">
              {order.fullName}
              <br />
              {order.address}
              <br />
              {order.postalCode} {order.city}
              <br />
              {order.phone}
            </p>
          </div>
          <div>
            <h2 className="label mb-3 text-ink-muted">Plaćanje</h2>
            <p className="text-body text-ink">Pouzećem, kuriru pri preuzimanju.</p>
          </div>
        </div>
      </div>
    </div>
  );
}