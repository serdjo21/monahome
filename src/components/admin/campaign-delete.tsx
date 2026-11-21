"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { deleteCampaign } from "@/server/admin/campaign-actions";

const linkButton = "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink";

/** Brisanje kampanje, sa potvrdom (server proverava da nije rezervna ni prikazana). */
export function CampaignDelete({ campaignId, blockedReason }: { campaignId: string; blockedReason: string | null }) {
  const [state, action, pending] = useActionState(deleteCampaign, null);
  const [confirm, setConfirm] = useState(false);

  if (blockedReason) return <p className="text-caption text-ink-muted">{blockedReason}</p>;

  return confirm ? (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      <p className="text-caption text-ink">Kampanja i njene fotografije se brišu trajno. Proizvodi ostaju.</p>
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
    <button type="button" onClick={() => setConfirm(true)} className={`${linkButton} self-start`}>
      Obriši kampanju
    </button>
  );
}