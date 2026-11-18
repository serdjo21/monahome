import "server-only";

import { InviteEmail, inviteSubject } from "@/emails/invite";
import { PasswordResetEmail, passwordResetSubject } from "@/emails/password-reset";
import type { Role } from "@/generated/prisma/enums";

import { renderEmail } from "./order-emails";
import { sendEmail } from "./send";

/** Uloga u rečenici „sa ulogom …“. */
const ROLE_IN_SENTENCE: Record<Role, string> = {
  ADMIN: "administratora",
  AFFILIATE: "partnera",
  CLIENT: "kupca",
};

/** Link za novu lozinku (zaboravljena lozinka). Važi 60 minuta. */
export async function sendPasswordResetEmail(to: string, link: string, name: string | null) {
  await sendEmail({
    to,
    subject: passwordResetSubject,
    ...(await renderEmail(<PasswordResetEmail link={link} email={to} name={name} />)),
  });
}

/** Poziv za nalog koji je napravio administrator. Važi sedam dana. */
export async function sendInviteEmail(to: string, link: string, name: string | null, role: Role) {
  await sendEmail({
    to,
    subject: inviteSubject,
    ...(await renderEmail(<InviteEmail link={link} email={to} name={name} roleLabel={ROLE_IN_SENTENCE[role]} />)),
  });
}