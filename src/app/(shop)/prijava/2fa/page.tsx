// src/app/(shop)/prijava/2fa/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { getCurrentUser } from "@/server/auth/guard";
import { getTwoFactorSetup } from "@/server/auth/two-factor";

export const metadata: Metadata = {
  title: "Dvofaktorska zaštita",
  robots: { index: false },
};

/**
 * Obavezno podešavanje 2FA za administratore. Admin bez 2FA ovde stiže automatski (requireRole),
 * a dok ga ne podesi, ne vidi nijednu admin stranicu.
 */
export default function TwoFactorPage() {
  return (
    <AuthCard
      eyebrow="Admin"
      title="Dvofaktorska zaštita"
      intro="Pre ulaska u admin povežite nalog sa aplikacijom za autentifikaciju. Pri svakoj prijavi, pored lozinke, unosićete kod iz aplikacije."
    >
      <Suspense fallback={<div className="min-h-96" />}>
        <SetupPanel />
      </Suspense>
    </AuthCard>
  );
}

async function SetupPanel() {
  const user = await getCurrentUser();
  if (!user) redirect("/prijava?next=/prijava/2fa");
  if (user.role !== "ADMIN") redirect("/");
  if (user.twoFactor) redirect("/admin");

  const setup = await getTwoFactorSetup(user);
  return <TwoFactorSetup qrSvg={setup.qrSvg} manualKey={setup.manualKey} />;
}