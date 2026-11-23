// src/server/auth/two-factor.ts
import "server-only";

import QRCode from "qrcode";

import { prisma } from "@/server/db";

import { decryptSecret, encryptSecret, formatSecret, generateTotpSecret, hashBackupCode, matchTotp, otpauthUrl } from "./totp";

/**
 * Podaci za ekran podešavanja: QR kod i ključ za ručni unos. Ključ se pravi pri prvom otvaranju
 * i čuva (šifrovan) dok se ne potvrdi kodom; ponovno otvaranje stranice prikazuje isti QR kod.
 */
export async function getTwoFactorSetup(user: { id: string; email: string }) {
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { totpSecret: true } });

  let secret: string;
  if (record?.totpSecret) {
    secret = decryptSecret(record.totpSecret);
  } else {
    secret = generateTotpSecret();
    // Upis samo ako ključ još ne postoji: dva otvorena taba ne prave dva različita ključa.
    const updated = await prisma.user.updateMany({
      where: { id: user.id, totpSecret: null },
      data: { totpSecret: encryptSecret(secret) },
    });
    if (updated.count === 0) {
      const again = await prisma.user.findUnique({ where: { id: user.id }, select: { totpSecret: true } });
      secret = decryptSecret(again!.totpSecret!);
    }
  }

  const qrSvg = await QRCode.toString(otpauthUrl(secret, user.email), {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#2a211dff", light: "#00000000" },
  });

  return { qrSvg, manualKey: formatSecret(secret) };
}

/**
 * Kod iz aplikacije ili rezervni kod, za prijavu korisnika koji ima uključen 2FA.
 * - Kod iz aplikacije: isti kod ne prolazi dva puta (čuva se poslednji iskorišćen korak).
 * - Rezervni kod: briše se posle upotrebe.
 * Oba upisa su uslovna (updateMany sa uslovom), pa dva istovremena zahteva ne mogu iskoristiti isti kod.
 */
export async function verifySecondFactor(userId: string, rawCode: string): Promise<boolean> {
  const code = rawCode.trim();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpLastStep: true, backupCodes: true },
  });
  if (!user?.totpSecret) return false;

  if (/^\d{6}$/.test(code)) {
    const step = matchTotp(decryptSecret(user.totpSecret), code);
    if (step === null) return false;
    const updated = await prisma.user.updateMany({
      where: { id: userId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
      data: { totpLastStep: step },
    });
    return updated.count === 1;
  }

  const hash = hashBackupCode(code);
  if (!user.backupCodes.includes(hash)) return false;
  const updated = await prisma.user.updateMany({
    where: { id: userId, backupCodes: { has: hash } },
    data: { backupCodes: { set: user.backupCodes.filter((stored: string) => stored !== hash) } },
  });
  return updated.count === 1;
}