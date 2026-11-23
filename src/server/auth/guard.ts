// src/server/auth/guard.ts
import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/server/db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  /** Dvofaktorska zaštita uključena (obavezna za ADMIN). */
  twoFactor: boolean;
};

/**
 * Prijavljeni korisnik, proveren u bazi: nalog postoji, aktivan je i sesija nije zastarela
 * (promena lozinke, uloge ili deaktivacija odmah odjavljuje sve uređaje). Inače null.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Sesija zavisi od kolačića konkretnog zahteva: ovo se nikad ne generiše unapred.
  await connection();
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, isActive: true, sessionVersion: true, totpEnabledAt: true },
  });
  if (!user || !user.isActive || user.sessionVersion !== session.user.sessionVersion) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role, twoFactor: user.totpEnabledAt !== null };
}

/**
 * Za stranice i akcije koje zahtevaju ulogu. Neprijavljen → /prijava (pa nazad), pogrešna uloga → početna.
 * Administrator bez dvofaktorske zaštite → /prijava/2fa (podešavanje je obavezno pre ulaska u admin).
 * Poziva se u svakoj admin stranici i SVAKOJ admin server akciji; meni nije zaštita.
 */
export async function requireRole(role: Role, returnTo = "/admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/prijava?next=${encodeURIComponent(returnTo)}`);
  if (user.role !== role) redirect("/");
  if (user.role === "ADMIN" && !user.twoFactor) redirect("/prijava/2fa");
  return user;
}