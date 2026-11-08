"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { subscribeToNewsletter, type NewsletterState } from "@/server/newsletter";

const initial: NewsletterState = { status: "idle" };

/** Prijava na novosti: obična sekcija u toku strane, nikad iskačući prozor. */
export function Newsletter() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initial);

  return (
    <section aria-labelledby="novosti" className="border-t border-hairline py-16 md:py-section">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <p className="eyebrow text-ink-muted">Novosti</p>
          <h2
            id="novosti"
            className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-balance text-ink md:text-display-2"
          >
            Prvi saznajte za nove kolekcije.
          </h2>
        </div>

        <div className="flex flex-col justify-end lg:col-span-5 lg:col-start-8">
          {state.status === "success" ? (
            <p role="status" className="font-display text-display-3 text-ink">
              {state.message}
            </p>
          ) : (
            <form action={formAction} noValidate className="flex flex-col gap-3">
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="newsletter-website">Ne popunjavajte ovo polje</label>
                <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <label htmlFor="newsletter-email" className="eyebrow text-ink-muted">
                E-mail adresa
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder="ime@primer.rs"
                  defaultValue={state.status === "error" ? state.email : undefined}
                  aria-invalid={state.status === "error" || undefined}
                  aria-describedby={state.status === "error" ? "newsletter-greska" : undefined}
                  className="h-13 flex-1 border-0 border-b border-ink bg-transparent px-0 text-body-lg text-ink placeholder:text-ink-muted/70 focus:border-b-2 focus:outline-none"
                />
                <button type="submit" disabled={pending} className={buttonClass("primary")}>
                  {pending ? "Šaljem…" : "Prijavi se"}
                </button>
              </div>
              {state.status === "error" ? (
                <p id="newsletter-greska" role="alert" className="text-caption text-accent">
                  {state.message}
                </p>
              ) : null}
              <p className="text-caption text-ink-muted">Samo nove kolekcije i poneka priča. Bez spama.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}