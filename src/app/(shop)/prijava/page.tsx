import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false },
};

const NOTICES: Record<string, string> = {
  postavljena: "Lozinka je sačuvana. Prijavite se novom lozinkom.",
};

export default function LoginPage({ searchParams }: PageProps<"/prijava">) {
  return (
    <AuthCard eyebrow="Nalog" title="Prijava">
      <Suspense fallback={<div className="min-h-80" />}>
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginPanel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  const notice = typeof params.lozinka === "string" ? (NOTICES[params.lozinka] ?? null) : null;
  return <LoginForm next={next} notice={notice} />;
}