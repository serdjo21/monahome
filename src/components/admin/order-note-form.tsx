"use client";

import { useActionState } from "react";

import { TextAreaField } from "@/components/ui/field";
import { saveOrderNote } from "@/server/admin/order-actions";

/** Interna napomena (npr. „zvao, javiti se posle 17h“). Vidi je samo prodavnica. */
export function OrderNoteForm({ orderId, note }: { orderId: string; note: string | null }) {
  const [state, action, pending] = useActionState(saveOrderNote, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <TextAreaField
        name="internalNote"
        label="Interna napomena"
        defaultValue={note ?? ""}
        maxLength={2000}
        error={state?.error}
        hint="Kupac ovu napomenu ne vidi."
      />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="text-caption text-ink underline underline-offset-4 transition-colors hover:text-ink-muted disabled:opacity-50"
        >
          {pending ? "Čuvanje…" : "Sačuvaj napomenu"}
        </button>
        {state?.message ? <span className="text-caption text-ink-muted">{state.message}</span> : null}
      </div>
    </form>
  );
}