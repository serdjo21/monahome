"use client";

import Link from "next/link";
import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PASSWORD_MIN } from "@/lib/auth-forms";
import { setPasswordFromToken } from "@/server/auth/actions";

import { FormNotice } from "./auth-card";

export function NewPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(setPasswordFromToken, null);

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error ? (
        <FormNotice tone="error">
          {state.error}{" "}
          <Link href="/lozinka/zaboravljena" className="underline underline-offset-4">
            Novi link
          </Link>
        </FormNotice>
      ) : null}
      <input type="hidden" name="token" value={token} />

      <Field
        name="password"
        type="password"
        label="Nova lozinka"
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        error={state?.fieldErrors?.password}
        hint={`Najmanje ${PASSWORD_MIN} znakova.`}
      />
      <Field
        name="confirm"
        type="password"
        label="Ponovite lozinku"
        autoComplete="new-password"
        required
        error={state?.fieldErrors?.confirm}
      />

      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? "Čuvanje…" : "Sačuvaj lozinku"}
      </button>
    </form>
  );
}