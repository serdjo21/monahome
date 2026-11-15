import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Zaboravljena lozinka",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="Nalog"
      title="Zaboravljena lozinka"
      intro="Unesite e-mail naloga i poslaćemo vam link za postavljanje nove lozinke."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}