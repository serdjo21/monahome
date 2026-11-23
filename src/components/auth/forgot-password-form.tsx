// src/components/auth/forgot-password-form.tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Turnstile } from "@/components/ui/turnstile";
import { requestPasswordReset } from "@/server/auth/actions";

import { FormNotice } from "./auth-card";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  if (state?.message) {
    return (
      <div className="flex flex-col gap-6">
        <FormNotice tone="success">{state.message}</FormNotice>
        <Link href="/prijava" className="text-caption text-ink-muted underline underline-offset-4 hover:text-ink">
          Nazad na prijavu
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}
      <Field
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
      />
      <Turnstile action="password_reset" resetKey={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? "Šaljemo…" : "Pošalji link"}
      </button>
      <Link href="/prijava" className="self-center text-caption text-ink-muted underline underline-offset-4 hover:text-ink">
        Nazad na prijavu
      </Link>
    </form>
  );
}