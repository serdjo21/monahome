"use client";

import Link from "next/link";
import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { login } from "@/server/auth/actions";

import { FormNotice } from "./auth-card";

export function LoginForm({ next, notice }: { next: string | null; notice: string | null }) {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error ? <FormNotice tone="error">{state.error}</FormNotice> : notice ? <FormNotice tone="success">{notice}</FormNotice> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field name="email" type="email" label="E-mail" autoComplete="email" required defaultValue={state?.values?.email} />
      <Field name="password" type="password" label="Lozinka" autoComplete="current-password" required />

      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? "Prijavljivanje…" : "Prijavi se"}
      </button>

      <Link
        href="/lozinka/zaboravljena"
        className="self-center text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        Zaboravljena lozinka
      </Link>
    </form>
  );
}