// src/server/auth/two-factor-actions.ts
"use server";

import { prisma } from "@/server/db";

import { getCurrentUser } from "./guard";
import { decryptSecret, generateBackupCodes, hashBackupCode, matchTotp } from "./totp";

export type TwoFactorSetupState = { error?: string; backupCodes?: string[] } | null;

/** Potvrda podešavanja: prvi kod iz aplikacije uključuje 2FA i pravi rezervne kodove (prikazuju se jednom). */
export async function confirmTwoFactor(_previous: TwoFactorSetupState, formData: FormData): Promise<TwoFactorSetupState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "Sesija je istekla. Prijavite se ponovo." };
  if (user.twoFactor) return { error: "Dvofaktorska zaštita je već uključena." };

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Unesite šestocifreni kod iz aplikacije." };

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { totpSecret: true } });
  if (!record?.totpSecret) return { error: "Kod za podešavanje je istekao. Osvežite stranicu." };

  const step = matchTotp(decryptSecret(record.totpSecret), code);
  if (step === null) {
    return { error: "Kod nije ispravan. Proverite da li je vreme na telefonu tačno i unesite novi kod." };
  }

  const backupCodes = generateBackupCodes();
  const updated = await prisma.user.updateMany({
    where: { id: user.id, totpEnabledAt: null },
    data: {
      totpEnabledAt: new Date(),
      totpLastStep: step,
      backupCodes: { set: backupCodes.map(hashBackupCode) },
    },
  });
  if (updated.count === 0) return { error: "Dvofaktorska zaštita je već uključena." };

  return { backupCodes };
}