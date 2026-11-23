// src/components/auth/two-factor-setup.tsx
"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { confirmTwoFactor } from "@/server/auth/two-factor-actions";

import { FormNotice } from "./auth-card";

/** Dva koraka: skeniranje QR koda i potvrda kodom, zatim rezervni kodovi (prikazuju se samo jednom). */
export function TwoFactorSetup({ qrSvg, manualKey }: { qrSvg: string; manualKey: string }) {
  const [state, action, pending] = useActionState(confirmTwoFactor, null);

  if (state?.backupCodes) return <BackupCodes codes={state.backupCodes} />;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5">
        <p className="label text-ink">1. Skenirajte kod</p>
        <p className="text-body text-ink-muted">
          Otvorite Google Authenticator, Microsoft Authenticator, 1Password ili sličnu aplikaciju i skenirajte kod.
        </p>
        <div
          aria-label="QR kod za aplikaciju za autentifikaciju"
          role="img"
          className="w-52 self-center bg-surface-raised p-5 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
          // SVG pravi server (paket qrcode) iz našeg ključa; ne sadrži unos korisnika.
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="flex flex-col gap-1">
          <p className="text-caption text-ink-muted">Ne možete da skenirate? Unesite ključ ručno:</p>
          <code className="text-body tracking-[0.08em] break-all text-ink select-all">{manualKey}</code>
        </div>
      </section>

      <form action={action} className="flex flex-col gap-6">
        <p className="label text-ink">2. Potvrdite kodom</p>
        {state?.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}
        <Field
          name="code"
          label="Šestocifreni kod iz aplikacije"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={7}
          required
        />
        <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
          {pending ? "Proveravamo…" : "Uključi zaštitu"}
        </button>
      </form>
    </div>
  );
}

function BackupCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <FormNotice tone="success">Dvofaktorska zaštita je uključena.</FormNotice>

      <section className="flex flex-col gap-4">
        <p className="label text-ink">Rezervni kodovi</p>
        <p className="text-body text-ink-muted">
          Ako izgubite telefon, prijavićete se jednim od ovih kodova umesto koda iz aplikacije. Svaki kod važi samo
          jednom. Sačuvajte ih u menadžeru lozinki: <strong className="font-medium text-ink">više se neće prikazati</strong>.
        </p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 bg-surface-raised p-6">
          {codes.map((code) => (
            <li key={code} className="text-body tracking-[0.08em] text-ink tabular-nums select-all">
              {code}
            </li>
          ))}
        </ul>
        <button type="button" onClick={copy} className={buttonClass("outline", "w-full")}>
          {copied ? "Kopirano" : "Kopiraj kodove"}
        </button>
      </section>

      <Link href="/admin" prefetch={false} className={buttonClass("primary", "w-full")}>
        Sačuvao sam kodove, nastavi u admin
      </Link>
    </div>
  );
}