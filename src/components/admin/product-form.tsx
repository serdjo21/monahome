"use client";

import { useActionState, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { slugify } from "@/lib/slug";
import { saveProduct } from "@/server/admin/product-actions";

export type ProductFormData = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  care: string | null;
  priceRsd: number;
  compareAtRsd: number | null;
  isNew: boolean;
  roomIds: string[];
};

type RoomOption = { id: string; name: string; isVisible: boolean };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5 border-t border-hairline pt-6 first:border-t-0 first:pt-0">
      <legend className="mb-1 label text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Forma proizvoda (novi i izmena). Šalje se bez automatskog pražnjenja polja,
 * pa uneti tekst ostaje i kad server vrati grešku.
 */
export function ProductForm({ product, rooms }: { product?: ProductFormData; rooms: RoomOption[] }) {
  const [state, action, pending] = useActionState(saveProduct, null);
  const [, startTransition] = useTransition();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const errors = state?.fieldErrors ?? {};
  const previewSlug = slugify(slug || name);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-8"
      noValidate
    >
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}

      <Section title="Osnovno">
        <Field
          name="name"
          label="Naziv"
          required
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <Field
          name="subtitle"
          label="Podnaslov (opciono)"
          maxLength={120}
          defaultValue={product?.subtitle ?? ""}
          hint="Kratka linija ispod naziva, npr. „Merino vuna“ ili „Ručno glaziran kamen“."
          error={errors.subtitle}
        />
        <Field
          name="slug"
          label="Link (opciono)"
          maxLength={120}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder={slugify(name) || "pravi-se-iz-naziva"}
          hint={previewSlug ? `monahome.rs/proizvod/${previewSlug}` : "Pravi se sam iz naziva."}
          error={errors.slug}
        />
      </Section>

      <Section title="Cena">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="priceRsd"
            label="Cena (RSD)"
            inputMode="numeric"
            required
            defaultValue={product ? String(product.priceRsd) : ""}
            placeholder="8900"
            error={errors.priceRsd}
          />
          <Field
            name="compareAtRsd"
            label="Stara cena (opciono)"
            inputMode="numeric"
            defaultValue={product?.compareAtRsd ? String(product.compareAtRsd) : ""}
            hint="Samo za sezonsko sniženje; prikazuje se precrtano."
            error={errors.compareAtRsd}
          />
        </div>
      </Section>

      <Section title="Opis">
        <TextAreaField
          name="description"
          label="Opis"
          rows={6}
          maxLength={5000}
          defaultValue={product?.description ?? ""}
          hint="Prazan red između pasusa."
          error={errors.description}
        />
        <TextAreaField
          name="care"
          label="Sastav i nega (opciono)"
          rows={4}
          maxLength={3000}
          defaultValue={product?.care ?? ""}
          hint="Materijal, dimenzije, pranje i sušenje. Svaka stavka u novom redu."
          error={errors.care}
        />
      </Section>

      <Section title="Sobe">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {rooms.map((room) => (
            <label key={room.id} className="flex cursor-pointer items-center gap-3 text-body text-ink">
              <input
                type="checkbox"
                name="roomIds"
                value={room.id}
                defaultChecked={product?.roomIds.includes(room.id)}
                className="size-4 accent-espreso"
              />
              {room.name}
              {!room.isVisible ? <span className="text-caption text-ink-muted">(skrivena)</span> : null}
            </label>
          ))}
        </div>
        <p className="text-caption text-ink-muted">
          {errors.roomIds ??
            "Proizvod može stajati u više soba. Na stranici proizvoda se kao putanja prikazuje prva soba po redosledu iz menija."}
        </p>
        <label className="flex cursor-pointer items-center gap-3 text-body text-ink">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="size-4 accent-espreso" />
          Oznaka „Novo“
        </label>
      </Section>

      <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:gap-6">
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm:w-auto")}>
          {pending ? "Čuvanje…" : product ? "Sačuvaj izmene" : "Napravi proizvod"}
        </button>
        {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
        {state?.message ? <p className="text-caption text-ink">{state.message}</p> : null}
        {state?.fieldErrors ? <p className="text-caption text-accent">Proverite označena polja.</p> : null}
      </div>
    </form>
  );
}