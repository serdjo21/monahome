"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import type { Role } from "@/generated/prisma/enums";
import { PASSWORD_MIN, type FormState } from "@/lib/auth-forms";
import { appOrigin } from "@/lib/site";
import { createToken, hashPassword, hashToken } from "@/server/auth/password";
import { prisma } from "@/server/db";
import { sendPasswordResetEmail } from "@/server/email/auth-emails";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ error: "Unesite ispravnu e-mail adresu." }));

/** Samo putanje na ovom sajtu („/admin/...“), nikad tuđi domen ili „//evil.com“. */
function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function destinationFor(role: Role, next: string | null): string {
  if (role === "ADMIN") return next?.startsWith("/admin") ? next : "/admin";
  if (next && !next.startsWith("/admin")) return next;
  return "/";
}

export async function login(_previous: FormState, formData: FormData): Promise<FormState> {
  const emailParsed = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const values = { email: String(formData.get("email") ?? "") };
  if (!emailParsed.success || password.length === 0) {
    return { error: "Unesite e-mail i lozinku.", values };
  }
  const email = emailParsed.data;

  const since = new Date(Date.now() - LOCK_MINUTES * 60_000);
  const failed = await prisma.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } });
  if (failed >= MAX_FAILED_LOGINS) {
    return { error: `Previše neuspešnih pokušaja. Pokušajte ponovo za ${LOCK_MINUTES} minuta.`, values };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Pogrešan e-mail ili lozinka.", values };
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  redirect(destinationFor(user?.role ?? "CLIENT", safeNext(formData.get("next"))));
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/prijava" });
}

/** Uvek isti odgovor, da se preko forme ne može proveriti ko ima nalog. */
export async function requestPasswordReset(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { fieldErrors: { email: "Unesite ispravnu e-mail adresu." }, values: { email: String(formData.get("email") ?? "") } };
  }

  const done: FormState = {
    message: "Ako postoji nalog sa ovom adresom, poslali smo link za novu lozinku. Proverite i folder za neželjenu poštu.",
  };

  const user = await prisma.user.findUnique({ where: { email: parsed.data }, select: { id: true, email: true, isActive: true } });
  if (!user?.isActive) return done;

  // Najviše tri linka na sat po nalogu.
  const recent = await prisma.passwordToken.count({
    where: { userId: user.id, purpose: "RESET", createdAt: { gte: new Date(Date.now() - 60 * 60_000) } },
  });
  if (recent >= 3) return done;

  const { token, tokenHash } = createToken();
  await prisma.passwordToken.create({
    data: { userId: user.id, tokenHash, purpose: "RESET", expiresAt: new Date(Date.now() + 60 * 60_000) },
  });
  await sendPasswordResetEmail(user.email, `${appOrigin()}/lozinka/nova?token=${token}`);

  return done;
}

const newPasswordSchema = z
  .object({
    token: z.string().min(20).max(100),
    password: z
      .string()
      .min(PASSWORD_MIN, { error: `Lozinka mora imati najmanje ${PASSWORD_MIN} znakova.` })
      .max(200, { error: "Lozinka je predugačka." }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, { path: ["confirm"], error: "Lozinke se ne poklapaju." });

/** Postavljanje lozinke iz linka (zaboravljena lozinka ili pozivnica). */
export async function setPasswordFromToken(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    if (fieldErrors.token) return { error: "Link nije ispravan. Zatražite novi." };
    return { fieldErrors };
  }

  const record = await prisma.passwordToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true, user: { select: { isActive: true } } },
  });
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) {
    return { error: "Link je istekao ili je već iskorišćen. Zatražite novi." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    // Nova lozinka odjavljuje sve uređaje na kojima je nalog bio prijavljen.
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    prisma.passwordToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordToken.deleteMany({ where: { userId: record.userId, usedAt: null, id: { not: record.id } } }),
  ]);

  redirect("/prijava?lozinka=postavljena");
}