"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { OrderStatus } from "@/generated/prisma/enums";
import { COURIERS, ORDER_TRANSITIONS } from "@/lib/order-status";
import { updateOrderStatus } from "@/server/admin/order-actions";

const linkButton = "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50";

/**
 * Sledeći koraci za porudžbinu, samo oni koji su dozvoljeni za trenutni status.
 * Slanje traži kurira i broj pošiljke (nije obavezno), otkazivanje traži potvrdu.
 */
export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState(updateOrderStatus, null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = ORDER_TRANSITIONS[status];

  if (next.length === 0) {
    return <p className="text-caption text-ink-muted">Porudžbina je završena; dalji koraci nisu mogući.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
      {state?.message ? <p className="text-caption text-ink">{state.message}</p> : null}

      {next.includes("CONFIRMED") ? (
        <form action={action}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="CONFIRMED" />
          <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
            Potvrdi porudžbinu
          </button>
        </form>
      ) : null}

      {next.includes("SHIPPED") ? (
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="SHIPPED" />
          <Field name="courier" label="Kurirska služba (opciono)" list="kurirske-sluzbe" autoComplete="off" />
          <datalist id="kurirske-sluzbe">
            {COURIERS.map((courier) => (
              <option key={courier} value={courier} />
            ))}
          </datalist>
          <Field name="trackingNumber" label="Broj pošiljke (opciono)" autoComplete="off" hint="Ide u mejl kupcu." />
          <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
            Označi kao poslatu
          </button>
        </form>
      ) : null}

      {next.includes("DELIVERED") ? (
        <form action={action}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="DELIVERED" />
          <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
            Označi kao isporučenu
          </button>
        </form>
      ) : null}

      {next.includes("CANCELLED") ? (
        confirmCancel ? (
          <form action={action} className="flex flex-col gap-3 border-t border-hairline pt-4">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="status" value="CANCELLED" />
            <p className="text-caption text-ink">
              Otkazivanje vraća rezervisane komade na stanje i ne može se poništiti.
            </p>
            <div className="flex items-center gap-5">
              <button type="submit" disabled={pending} className={buttonClass("outline")}>
                Potvrdi otkazivanje
              </button>
              <button type="button" onClick={() => setConfirmCancel(false)} className={linkButton}>
                Odustani
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setConfirmCancel(true)} className={`${linkButton} self-start`}>
            Otkaži porudžbinu
          </button>
        )
      ) : null}
    </div>
  );
}