"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import type { ProductStatus } from "@/generated/prisma/enums";
import { deleteProduct, setProductStatus } from "@/server/admin/product-actions";

const linkButton =
  "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50";

type Check = { ok: boolean; label: string; blocking?: boolean };

/**
 * Objava, sakrivanje i brisanje proizvoda, sa spiskom šta još nedostaje pre objave.
 * Bez aktivne varijante objava nije moguća; slike i soba su preporuka, ne uslov.
 */
export function ProductStatusActions({
  productId,
  slug,
  status,
  activeVariants,
  imageCount,
  roomCount,
}: {
  productId: string;
  slug: string;
  status: ProductStatus;
  activeVariants: number;
  imageCount: number;
  roomCount: number;
}) {
  const [statusState, statusAction, statusPending] = useActionState(setProductStatus, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteProduct, null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const feedback = deleteState ?? statusState;

  const checks: Check[] = [
    { ok: activeVariants > 0, label: "Bar jedna aktivna varijanta", blocking: true },
    { ok: imageCount > 0, label: "Fotografije" },
    { ok: roomCount > 0, label: "Bar jedna soba" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {status !== "ACTIVE" ? (
        <ul className="flex flex-col gap-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-3 text-caption">
              <span
                aria-hidden="true"
                className={check.ok ? "text-ink" : check.blocking ? "text-accent" : "text-ink-muted"}
              >
                {check.ok ? "✓" : "–"}
              </span>
              <span className={check.ok ? "text-ink" : "text-ink-muted"}>
                {check.label}
                {!check.ok && !check.blocking ? " (preporučeno)" : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption text-ink-muted">
          Proizvod se vidi na sajtu.{" "}
          <Link href={`/proizvod/${slug}`} target="_blank" className="text-ink underline underline-offset-4">
            Pogledaj na sajtu
          </Link>
        </p>
      )}

      {feedback?.error ? <p className="text-caption text-accent">{feedback.error}</p> : null}
      {feedback?.message ? <p className="text-caption text-ink">{feedback.message}</p> : null}

      <form action={statusAction}>
        <input type="hidden" name="productId" value={productId} />
        <input
          type="hidden"
          name="status"
          value={status === "ACTIVE" ? "DRAFT" : status === "ARCHIVED" ? "DRAFT" : "ACTIVE"}
        />
        {status === "ACTIVE" ? (
          <button type="submit" disabled={statusPending} className={buttonClass("outline", "w-full")}>
            Sakrij sa sajta
          </button>
        ) : status === "ARCHIVED" ? (
          <button type="submit" disabled={statusPending} className={buttonClass("outline", "w-full")}>
            Vrati u nacrt
          </button>
        ) : (
          <button
            type="submit"
            disabled={statusPending || activeVariants === 0}
            className={buttonClass("primary", "w-full")}
          >
            Objavi na sajtu
          </button>
        )}
      </form>

      {status !== "ACTIVE" ? (
        confirmDelete ? (
          <form action={deleteAction} className="flex flex-col gap-3 border-t border-hairline pt-4">
            <input type="hidden" name="productId" value={productId} />
            <p className="text-caption text-ink">
              Proizvod i njegove varijante se brišu trajno. Ako je već naručivan, biće arhiviran umesto obrisan.
            </p>
            <div className="flex items-center gap-5">
              <button type="submit" disabled={deletePending} className={buttonClass("outline")}>
                Potvrdi brisanje
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className={linkButton}>
                Odustani
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className={`${linkButton} self-start`}>
            Obriši proizvod
          </button>
        )
      ) : null}
    </div>
  );
}