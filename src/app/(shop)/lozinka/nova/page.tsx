import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard, FormNotice } from "@/components/auth/auth-card";
import { NewPasswordForm } from "@/components/auth/new-password-form";

export const metadata: Metadata = {
  title: "Nova lozinka",
  robots: { index: false },
};

/** Stranica iz linka u mejlu (zaboravljena lozinka ili pozivnica). Token se proverava tek pri čuvanju. */
export default function NewPasswordPage({ searchParams }: PageProps<"/lozinka/nova">) {
  return (
    <AuthCard eyebrow="Nalog" title="Nova lozinka" intro="Izaberite lozinku za svoj nalog.">
      <Suspense fallback={<div className="min-h-80" />}>
        <NewPasswordPanel searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function NewPasswordPanel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 20) {
    return (
      <FormNotice tone="error">
        Link nije potpun.{" "}
        <Link href="/lozinka/zaboravljena" className="underline underline-offset-4">
          Zatražite novi
        </Link>
        .
      </FormNotice>
    );
  }
  return <NewPasswordForm token={token} />;
}