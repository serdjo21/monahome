"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import { formatRsd } from "@/lib/format";
import { LOW_STOCK } from "@/lib/product-admin";
import { deleteVariant, saveVariant } from "@/server/admin/product-actions";

export type VariantData = {
  id: string;
  sku: string;
  colorName: string | null;
  colorHex: string | null;
  size: string | null;
  priceRsd: number | null;
  stock: number;
  reserved: number;
  isActive: boolean;
  ordered: boolean;
};

const DEFAULT_HEX = "#d6ccbd";

const input =
  "h-11 w-full border border-hairline bg-transparent px-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-muted/70 hover:border-ink-muted focus:border-ink aria-invalid:border-accent md:text-body";
const smallButton =
  "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50";

function Mini({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-[0.6875rem] tracking-[0.08em] text-ink-muted uppercase">{label}</span>
      {children}
      {error ? <span className="text-caption text-accent">{error}</span> : null}
    </label>
  );
}

/** Polja jedne varijante; ista za izmenu i za novu. */
function VariantFields({
  variant,
  errors,
  basePrice,
}: {
  variant?: VariantData;
  errors: Record<string, string>;
  basePrice: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_6rem]">
      <Mini label="Boja" error={errors.colorName ?? errors.colorHex} className="col-span-2 md:col-span-1">
        <span className="flex gap-2">
          <input
            type="color"
            name="colorHex"
            defaultValue={variant?.colorHex ?? DEFAULT_HEX}
            aria-label="Nijansa"
            className="h-11 w-11 shrink-0 cursor-pointer border border-hairline bg-transparent p-1"
          />
          <input
            name="colorName"
            defaultValue={variant?.colorName ?? ""}
            placeholder="npr. Krem"
            maxLength={40}
            aria-invalid={errors.colorName || errors.colorHex ? true : undefined}
            className={input}
          />
        </span>
      </Mini>
      <Mini label="Veličina" error={errors.size}>
        <input
          name="size"
          defaultValue={variant?.size ?? ""}
          placeholder="npr. 130 × 170 cm"
          maxLength={40}
          className={input}
        />
      </Mini>
      <Mini label="Šifra" error={errors.sku}>
        <input
          name="sku"
          defaultValue={variant?.sku ?? ""}
          placeholder="pravi se sama"
          maxLength={60}
          aria-invalid={errors.sku ? true : undefined}
          className={cn(input, "uppercase placeholder:normal-case")}
        />
      </Mini>
      <Mini label="Cena (RSD)" error={errors.priceRsd}>
        <input
          name="priceRsd"
          inputMode="numeric"
          defaultValue={variant?.priceRsd ? String(variant.priceRsd) : ""}
          placeholder={String(basePrice)}
          aria-invalid={errors.priceRsd ? true : undefined}
          className={input}
        />
      </Mini>
      <Mini label="Na stanju" error={errors.stock}>
        <input
          name="stock"
          inputMode="numeric"
          required
          defaultValue={variant ? String(variant.stock) : "0"}
          aria-invalid={errors.stock ? true : undefined}
          className={input}
        />
      </Mini>
    </div>
  );
}

function submitWithoutReset(action: (formData: FormData) => void, startTransition: React.TransitionStartFunction) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}

function VariantRow({ productId, variant, basePrice }: { productId: string; variant: VariantData; basePrice: number }) {
  const [saveState, saveAction, saving] = useActionState(saveVariant, null);
  const [deleteState, deleteAction, deleting] = useActionState(deleteVariant, null);
  const [, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const feedback = deleteState ?? saveState;
  const available = Math.max(0, variant.stock - variant.reserved);

  return (
    <li className={cn("border-b border-hairline py-6 first:pt-2 last:border-b-0", !variant.isActive && "opacity-70")}>
      <form onSubmit={submitWithoutReset(saveAction, startTransition)} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="variantId" value={variant.id} />
        <VariantFields variant={variant} errors={saveState?.fieldErrors ?? {}} basePrice={basePrice} />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-caption text-ink">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={variant.isActive}
              className="size-4 accent-espreso"
            />
            Aktivna
          </label>
          <p className="text-caption text-ink-muted">
            <span className={cn(available === 0 ? "text-accent" : available <= LOW_STOCK && "text-ink")}>
              Dostupno {available}
            </span>
            {variant.reserved > 0 ? ` · rezervisano ${variant.reserved}` : null}
            {variant.priceRsd ? ` · ${formatRsd(variant.priceRsd)}` : null}
            {variant.ordered ? " · naručivana" : null}
          </p>
          <div className="ml-auto flex items-center gap-5">
            <button type="submit" disabled={saving} className={cn(smallButton, "text-ink")}>
              {saving ? "Čuvanje…" : "Sačuvaj"}
            </button>
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} className={smallButton}>
                Obriši
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {confirmDelete ? (
        <form action={deleteAction} className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variant.id} />
          <span className="text-caption text-ink">Obrisati ovu varijantu?</span>
          <button type="submit" disabled={deleting} className={cn(smallButton, "text-accent")}>
            Da, obriši
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)} className={smallButton}>
            Odustani
          </button>
        </form>
      ) : null}

      {feedback?.error ? <p className="mt-3 text-caption text-accent">{feedback.error}</p> : null}
      {feedback?.message ? <p className="mt-3 text-caption text-ink-muted">{feedback.message}</p> : null}
    </li>
  );
}

function NewVariantForm({ productId, basePrice, first }: { productId: string; basePrice: number; first: boolean }) {
  const [state, action, pending] = useActionState(saveVariant, null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Posle uspešnog dodavanja polja se prazne za sledeću varijantu; posle greške ostaju.
  useEffect(() => {
    if (state?.message) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      onSubmit={submitWithoutReset(action, startTransition)}
      className="flex flex-col gap-4 border-t border-hairline pt-6"
      noValidate
    >
      <p className="label text-ink">{first ? "Prva varijanta" : "Nova varijanta"}</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="isActive" value="on" />
      <VariantFields errors={state?.fieldErrors ?? {}} basePrice={basePrice} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="submit"
          disabled={pending}
          className="border border-ink px-5 py-3 label text-ink transition-colors hover:bg-ink hover:text-surface disabled:opacity-50"
        >
          {pending ? "Dodavanje…" : "Dodaj varijantu"}
        </button>
        {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
        {state?.message ? <p className="text-caption text-ink-muted">{state.message}</p> : null}
      </div>
    </form>
  );
}

/**
 * Varijante proizvoda (boja × veličina). Lager se vodi samo ovde.
 * Proizvod bez boja i veličina ima jednu varijantu sa praznim poljima, samo radi lagera.
 */
export function VariantEditor({
  productId,
  variants,
  basePrice,
}: {
  productId: string;
  variants: VariantData[];
  basePrice: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-ink-muted">
        Prazna cena znači osnovnu cenu proizvoda. Boja bez naziva se ne prikazuje. Proizvod bez boja i veličina ima
        jednu varijantu sa praznim poljima, samo za lager.
      </p>
      {variants.length > 0 ? (
        <ul>
          {variants.map((variant) => (
            <VariantRow key={variant.id} productId={productId} variant={variant} basePrice={basePrice} />
          ))}
        </ul>
      ) : null}
      <NewVariantForm productId={productId} basePrice={basePrice} first={variants.length === 0} />
    </div>
  );
}