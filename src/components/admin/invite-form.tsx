"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL } from "@/lib/auth-forms";
import { inviteUser } from "@/server/admin/users";

/** Novi korisnik: dobija mejl sa linkom i sam postavlja lozinku. Admin nikad ne vidi tuđu lozinku. */
export function InviteForm() {
  const [state, action, pending] = useActionState(inviteUser, null);

  return (
    <form action={action} className="grid gap-5 md:grid-cols-[1fr_1fr_12rem_auto] md:items-end">
      <Field
        name="email"
        type="email"
        label="E-mail"
        required
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
      />
      <Field name="name" label="Ime (nije obavezno)" defaultValue={state?.values?.name} error={state?.fieldErrors?.name} />
      <div className="flex flex-col gap-2">
        <label htmlFor="poziv-uloga" className="label text-ink-muted">
          Uloga
        </label>
        <select
          id="poziv-uloga"
          name="role"
          defaultValue={state?.values?.role ?? "AFFILIATE"}
          className="h-13 border border-hairline bg-transparent px-3 text-[16px] md:text-body text-ink outline-none focus:border-ink"
        >
          {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Šaljemo…" : "Pošalji poziv"}
      </button>
      {state?.message ? <p className="text-caption text-ink-muted md:col-span-4">{state.message}</p> : null}
    </form>
  );
}