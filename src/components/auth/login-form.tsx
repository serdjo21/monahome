// src/components/auth/login-form.tsx
"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Turnstile } from "@/components/ui/turnstile";
import { cn } from "@/lib/cn";
import { login } from "@/server/auth/actions";

import { FormNotice } from "./auth-card";

/**
 * Prijava u dva koraka za naloge sa 2FA: posle ispravne lozinke ista forma traži kod.
 * Forma se šalje preko onSubmit (ne `action={…}`), da React ne isprazni polja posle odgovora:
 * mejl i lozinka ostaju u (skrivenim) poljima i šalju se ponovo zajedno sa kodom.
 */
export function LoginForm({ next, notice }: { next: string | null; notice: string | null }) {
  const [state, action, pending] = useActionState(login, null);
  const codeRef = useRef<HTMLInputElement>(null);
  const twoFactor = Boolean(state?.twoFactor);

  useEffect(() => {
    if (twoFactor) codeRef.current?.focus();
  }, [twoFactor, state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {state?.error ? <FormNotice tone="error">{state.error}</FormNotice> : notice ? <FormNotice tone="success">{notice}</FormNotice> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className={cn("flex flex-col gap-6", twoFactor && "hidden")}>
        <Field name="email" type="email" label="E-mail" autoComplete="email" required defaultValue={state?.values?.email} />
        <Field name="password" type="password" label="Lozinka" autoComplete="current-password" required />
      </div>

      {twoFactor ? (
        <>
          <p className="text-body text-ink-muted">
            Unesite šestocifreni kod iz aplikacije za autentifikaciju. Ako nemate telefon uz sebe, unesite jedan od
            rezervnih kodova.
          </p>
          <Field
            ref={codeRef}
            name="code"
            label="Kod"
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={11}
            required
          />
        </>
      ) : null}

      <Turnstile action="login" resetKey={state} />

      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? "Prijavljivanje…" : twoFactor ? "Potvrdi kod" : "Prijavi se"}
      </button>

      {twoFactor ? (
        <a
          href={next ? `/prijava?next=${encodeURIComponent(next)}` : "/prijava"}
          className="self-center text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Prijava drugim nalogom
        </a>
      ) : (
        <Link
          href="/lozinka/zaboravljena"
          className="self-center text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Zaboravljena lozinka
        </Link>
      )}
    </form>
  );
}