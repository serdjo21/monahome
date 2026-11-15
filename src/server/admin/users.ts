"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL, type FormState } from "@/lib/auth-forms";
import { appOrigin } from "@/lib/site";
import { requireRole } from "@/server/auth/guard";
import { createToken } from "@/server/auth/password";
import { prisma } from "@/server/db";
import { sendInviteEmail } from "@/server/email/auth-emails";

const roleSchema = z.enum(["CLIENT", "ADMIN", "AFFILIATE"]);
const INVITE_DAYS = 7;

/** Da prodavnica nikad ne ostane bez nijednog aktivnog administratora. */
async function wouldRemoveLastAdmin(userId: string, nextRole: Role, nextActive: boolean) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
  if (!target || target.role !== "ADMIN" || !target.isActive) return false;
  if (nextRole === "ADMIN" && nextActive) return false;
  const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true, id: { not: userId } } });
  return otherAdmins === 0;
}

async function sendInvite(user: { id: string; email: string; role: Role }) {
  const { token, tokenHash } = createToken();
  await prisma.passwordToken.create({
    data: { userId: user.id, tokenHash, purpose: "INVITE", expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) },
  });
  await sendInviteEmail(user.email, `${appOrigin()}/lozinka/nova?token=${token}`, ROLE_LABEL[user.role]);
}

/** Promena uloge. Odjavljuje korisnika sa svih uređaja, da nova uloga važi odmah. */
export async function changeUserRole(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN", "/admin/korisnici");
  const userId = String(formData.get("userId") ?? "");
  const role = roleSchema.safeParse(formData.get("role"));
  if (!role.success) return { error: "Nepoznata uloga." };
  if (userId === admin.id) return { error: "Svoju ulogu ne možete menjati." };
  if (await wouldRemoveLastAdmin(userId, role.data, true)) return { error: "Mora ostati bar jedan administrator." };

  await prisma.user.update({ where: { id: userId }, data: { role: role.data, sessionVersion: { increment: 1 } } });
  revalidatePath("/admin/korisnici");
  return { message: "Sačuvano." };
}

/** Uključi ili isključi nalog. Isključen nalog se ne može prijaviti, a postojeće prijave odmah prestaju da važe. */
export async function toggleUserActive(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN", "/admin/korisnici");
  const userId = String(formData.get("userId") ?? "");
  if (userId === admin.id) return { error: "Svoj nalog ne možete isključiti." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true, role: true } });
  if (!user) return { error: "Nalog ne postoji." };
  if (await wouldRemoveLastAdmin(userId, user.role, !user.isActive)) return { error: "Mora ostati bar jedan administrator." };

  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive, sessionVersion: { increment: 1 } } });
  revalidatePath("/admin/korisnici");
  return { message: user.isActive ? "Nalog je isključen." : "Nalog je uključen." };
}

/** Ponovo pošalji pozivnicu nalogu koji još nema lozinku. */
export async function resendInvite(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/korisnici");
  const user = await prisma.user.findUnique({
    where: { id: String(formData.get("userId") ?? "") },
    select: { id: true, email: true, role: true, passwordHash: true, isActive: true },
  });
  if (!user || !user.isActive) return { error: "Nalog ne postoji ili je isključen." };
  if (user.passwordHash) return { error: "Korisnik već ima lozinku." };

  await sendInvite(user);
  return { message: "Pozivnica je poslata." };
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ error: "Unesite ispravnu e-mail adresu." })),
  name: z
    .string()
    .trim()
    .max(100, { error: "Ime je predugačko." })
    .transform((value) => value || null),
  role: roleSchema,
});

/** Novi nalog bez lozinke + mejl sa linkom da je korisnik sam postavi. */
export async function inviteUser(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/korisnici");
  const values = {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values };
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) return { fieldErrors: { email: "Nalog sa ovom adresom već postoji." }, values };

  const user = await prisma.user.create({
    data: { email: parsed.data.email, name: parsed.data.name, role: parsed.data.role },
    select: { id: true, email: true, role: true },
  });
  await sendInvite(user);

  revalidatePath("/admin/korisnici");
  return { message: `Pozivnica je poslata na ${user.email}.` };
}