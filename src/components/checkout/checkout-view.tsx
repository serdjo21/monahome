"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { CartLinesSkeleton, CartNotices } from "@/components/cart/cart-line-item";
import { useCartLines } from "@/components/cart/use-cart-lines";
import { buttonClass, TextLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { clearCart, removeFromCart, setCartQuantity, useCartItems, useCartReady } from "@/lib/cart/store";
import type { CheckoutState } from "@/lib/checkout";
import { formatRsd } from "@/lib/format";
import { placeOrder } from "@/server/checkout";

import { Field, TextAreaField } from "./field";

const initialState: CheckoutState = { status: "idle" };

/** Plaćanje na jednoj stranici: podaci kupca levo, pregled korpe desno. */
export function CheckoutView() {
  const router = useRouter();
  const ready = useCartReady();
  const items = useCartItems();
  const { lines, subtotal, isEmpty, isLoading, notices } = useCartLines(true);
  const [state, formAction, pending] = useActionState(placeOrder, initialState);

  // Posle uspeha: isprazni korpu i idi na „Hvala“. Posle manjka na lageru: uskladi korpu sa stanjem.
  useEffect(() => {
    if (state.status === "success") {
      clearCart();
      router.replace(state.href);
    } else if (state.status === "error" && state.adjustments) {
      const gone = state.adjustments.filter((a) => a.available === 0).map((a) => a.variantId);
      if (gone.length > 0) removeFromCart(gone);
      for (const adjustment of state.adjustments) {
        if (adjustment.available > 0) setCartQuantity(adjustment.variantId, adjustment.available);
      }
    }
  }, [state, router]);

  if (state.status === "success") {
    return <p className="font-display text-display-3 text-ink italic">Porudžbina je primljena…</p>;
  }

  if (!ready || (isLoading && lines.length === 0)) {
    return <CartLinesSkeleton count={3} />;
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-start gap-6 border-t border-hairline py-16">
        <p className="font-display text-display-3 text-ink italic">Vaša korpa je prazna.</p>
        <TextLink href="/">Nastavite kupovinu</TextLink>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? state.values : {};

  return (
    <form action={formAction} noValidate className="grid gap-12 lg:grid-cols-12 lg:gap-x-6">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      {/* Zamka za botove: ljudi je ne vide i ne popunjavaju. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Sajt
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-12 lg:col-span-7">
        {state.status === "error" && state.formError ? (
          <p role="alert" className="border-l-2 border-accent bg-surface-raised px-4 py-3 text-body text-ink">
            {state.formError}
          </p>
        ) : null}

        <fieldset className="flex flex-col gap-6">
          <legend className="mb-6 font-display text-display-3 text-ink">Kontakt</legend>
          <Field
            name="email"
            type="email"
            label="E-mail"
            autoComplete="email"
            required
            defaultValue={values.email}
            error={errors.email}
            hint="Na ovu adresu stiže potvrda porudžbine."
          />
          <Field
            name="phone"
            type="tel"
            label="Telefon"
            autoComplete="tel"
            required
            defaultValue={values.phone}
            error={errors.phone}
            hint="Kurir vas zove pre dostave."
          />
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <legend className="mb-6 font-display text-display-3 text-ink">Dostava</legend>
          <Field
            name="fullName"
            label="Ime i prezime"
            autoComplete="name"
            required
            defaultValue={values.fullName}
            error={errors.fullName}
          />
          <Field
            name="address"
            label="Ulica i broj"
            autoComplete="street-address"
            required
            defaultValue={values.address}
            error={errors.address}
          />
          <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
            <Field
              name="postalCode"
              label="Poštanski broj"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
              required
              defaultValue={values.postalCode}
              error={errors.postalCode}
            />
            <Field
              name="city"
              label="Mesto"
              autoComplete="address-level2"
              required
              defaultValue={values.city}
              error={errors.city}
            />
          </div>
          <TextAreaField
            name="note"
            label="Napomena za kurira (nije obavezno)"
            maxLength={500}
            defaultValue={values.note}
            error={errors.note}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-6 font-display text-display-3 text-ink">Plaćanje</legend>
          <div className="flex items-start gap-4 border border-ink px-5 py-4">
            <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-ink" />
            <div>
              <p className="text-body text-ink">Pouzećem</p>
              <p className="text-caption text-ink-muted">Plaćate kuriru gotovinom ili karticom pri preuzimanju.</p>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="lg:col-span-4 lg:col-start-9">
        <div className="flex flex-col gap-6 bg-surface-raised p-6 md:p-8 lg:sticky lg:top-24 xl:top-36">
          <h2 className="label text-ink">Vaša porudžbina</h2>
          <CartNotices notices={notices} />

          <ul className="flex flex-col gap-4 border-b border-hairline pb-6">
            {lines.map((line) => (
              <li key={line.variantId} className="flex gap-4">
                <div className="w-14 shrink-0">
                  <Media media={line.image} ratio="4/5" sizes="56px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-body text-ink">{line.productName}</p>
                  <p className="text-caption text-ink-muted">
                    {[line.variantLabel, `× ${line.quantity}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-body whitespace-nowrap text-ink">{formatRsd(line.unitPriceRsd * line.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-2">
            <div className="flex justify-between gap-4 text-body">
              <dt className="text-ink-muted">Međuzbir</dt>
              <dd className="text-ink">{formatRsd(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-body">
              <dt className="text-ink-muted">Dostava</dt>
              <dd className="text-ink-muted">Pri preuzimanju</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-hairline pt-4">
              <dt className="label text-ink">Ukupno</dt>
              <dd className="text-body-lg font-medium text-ink">{formatRsd(subtotal)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-3 text-caption text-ink-muted">
              <input
                type="checkbox"
                name="terms"
                required
                defaultChecked={values.terms === "on"}
                aria-invalid={errors.terms ? true : undefined}
                className="mt-0.5 size-4 shrink-0 accent-espreso"
              />
              <span>
                Saglasan/na sam sa{" "}
                <Link href="/uslovi-koriscenja" className="text-ink underline underline-offset-4">
                  uslovima kupovine
                </Link>{" "}
                i{" "}
                <Link href="/privatnost" className="text-ink underline underline-offset-4">
                  politikom privatnosti
                </Link>
                .
              </span>
            </label>
            {errors.terms ? <p className="text-caption text-accent">{errors.terms}</p> : null}
          </div>

          <button type="submit" disabled={pending || isLoading} className={buttonClass("primary", "w-full")}>
            {pending ? "Šaljemo porudžbinu…" : "Poruči"}
          </button>
        </div>
      </div>
    </form>
  );
}