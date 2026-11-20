"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { deleteRoom } from "@/server/admin/room-actions";

const linkButton = "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink";

/** Brisanje sobe; dozvoljeno samo kad je prazna (server to ponovo proverava). */
export function RoomDelete({ roomId, productCount }: { roomId: string; productCount: number }) {
  const [state, action, pending] = useActionState(deleteRoom, null);
  const [confirm, setConfirm] = useState(false);

  if (productCount > 0) {
    return (
      <p className="text-caption text-ink-muted">
        Soba ima proizvode ({productCount}), pa se ne može obrisati. Ako vam ne treba, isključite „Vidljiva na sajtu“.
      </p>
    );
  }

  return confirm ? (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="roomId" value={roomId} />
      <p className="text-caption text-ink">Soba i njene fotografije se brišu trajno.</p>
      <div className="flex items-center gap-5">
        <button type="submit" disabled={pending} className={buttonClass("outline")}>
          Potvrdi brisanje
        </button>
        <button type="button" onClick={() => setConfirm(false)} className={linkButton}>
          Odustani
        </button>
      </div>
      {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
    </form>
  ) : (
    <button type="button" onClick={() => setConfirm(true)} className={linkButton}>
      Obriši sobu
    </button>
  );
}