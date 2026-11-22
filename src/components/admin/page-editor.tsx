"use client";

import { useActionState, useState, useTransition } from "react";

import { RichText } from "@/components/pages/rich-text";
import { buttonClass } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { draftPage, type PageContent } from "@/lib/pages";
import { resetPage, savePage } from "@/server/admin/page-actions";

const linkButton =
  "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50";

const FORMAT_HELP = [
  ["## Podnaslov", "podnaslov"],
  ["- stavka", "lista"],
  ["1. stavka", "numerisana lista"],
  ["**tekst**", "podebljano"],
  ["[tekst](/dostava)", "link na stranicu sajta"],
  ["[pišite nam](mailto:office@monahome.rs)", "link za mejl"],
] as const;

/**
 * Uređivanje tekstualne stranice: naslov, uvod, tekst i opis za Google, sa pregledom
 * u istom izgledu kao na sajtu. Prazan red u tekstu počinje novi pasus.
 */
export function PageEditor({ page, customized }: { page: PageContent; customized: boolean }) {
  const [state, action, pending] = useActionState(savePage, null);
  const [, startTransition] = useTransition();
  const [resetting, startReset] = useTransition();
  const [body, setBody] = useState(page.body);
  const [preview, setPreview] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  // Posle vraćanja početnog teksta forma se iscrtava iznova, sa nacrtom u svim poljima.
  const [formKey, setFormKey] = useState(0);
  const errors = state?.fieldErrors ?? {};

  function reset() {
    startReset(async () => {
      const result = await resetPage(page.slug);
      if (!result.ok) return setResetMessage(result.error ?? "Greška.");
      setBody(draftPage(page.slug).body);
      setFormKey((key) => key + 1);
      setConfirmReset(false);
      setResetMessage("Vraćen je početni tekst.");
    });
  }

  const shown = formKey > 0 ? draftPage(page.slug) : page;

  return (
    <div className="flex flex-col gap-8">
      <form
        key={formKey}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => action(formData));
        }}
        className="flex flex-col gap-6"
        noValidate
      >
        <input type="hidden" name="slug" value={page.slug} />
        <Field name="title" label="Naslov" required maxLength={80} defaultValue={shown.title} error={errors.title} />
        <TextAreaField
          name="intro"
          label="Uvod (opciono)"
          rows={2}
          maxLength={300}
          defaultValue={shown.intro ?? ""}
          hint="Jedna do dve rečenice ispod naslova."
          error={errors.intro}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="label text-ink-muted">Tekst</span>
            <div className="flex border border-hairline" role="tablist" aria-label="Prikaz teksta">
              {[
                { value: false, label: "Uređivanje" },
                { value: true, label: "Pregled" },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={preview === tab.value}
                  onClick={() => setPreview(tab.value)}
                  className={cn(
                    "px-4 py-2 text-caption transition-colors",
                    preview === tab.value ? "bg-ink text-surface" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Polje ostaje u formi i kad je pregled otvoren, da se tekst pošalje pri čuvanju. */}
          <textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={22}
            maxLength={30_000}
            aria-label="Tekst stranice"
            aria-invalid={errors.body ? true : undefined}
            className={cn(
              "w-full border border-hairline bg-transparent px-4 py-3 font-mono text-[15px] leading-relaxed text-ink transition-colors outline-none hover:border-ink-muted focus:border-ink aria-invalid:border-accent",
              preview && "hidden",
            )}
          />
          {preview ? (
            <div className="min-h-[20rem] border border-hairline bg-surface px-5 py-8 md:px-10">
              <RichText source={body} />
            </div>
          ) : null}
          {errors.body ? <p className="text-caption text-accent">{errors.body}</p> : null}

          <details className="text-caption text-ink-muted">
            <summary className="cursor-pointer text-ink underline underline-offset-4">Kako se formatira tekst</summary>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              {FORMAT_HELP.map(([code, meaning]) => (
                <div key={code} className="contents">
                  <dt className="font-mono text-ink">{code}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">Prazan red između redova počinje novi pasus.</p>
          </details>
        </div>

        <TextAreaField
          name="seoDescription"
          label="Opis za Google (opciono)"
          rows={2}
          maxLength={160}
          defaultValue={shown.seoDescription ?? ""}
          hint="Do 160 znakova; prikazuje se ispod naslova u rezultatima pretrage."
          error={errors.seoDescription}
        />

        <div className="sticky bottom-0 z-10 -mx-5 flex flex-col gap-3 border-t border-hairline bg-surface-raised px-5 py-4 sm:flex-row sm:items-center sm:gap-6 md:-mx-6 md:px-6">
          <button type="submit" disabled={pending} className={buttonClass("primary", "sm:w-auto")}>
            {pending ? "Čuvanje…" : "Sačuvaj stranicu"}
          </button>
          {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
          {state?.fieldErrors ? <p className="text-caption text-accent">Proverite označena polja.</p> : null}
          {state?.message ? <p className="text-caption text-ink">{state.message}</p> : null}
        </div>
      </form>

      {customized || resetMessage ? (
        <div className="flex flex-col gap-3 border-t border-hairline pt-6">
          {!customized ? null : confirmReset ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-caption text-ink">Vaše izmene se brišu i vraća se početni tekst.</span>
              <button type="button" disabled={resetting} onClick={reset} className={cn(linkButton, "text-accent")}>
                Da, vrati
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className={linkButton}>
                Odustani
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className={cn(linkButton, "self-start")}>
              Vrati početni tekst
            </button>
          )}
          {resetMessage ? <p className="text-caption text-ink-muted">{resetMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
}