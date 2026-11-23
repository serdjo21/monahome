// src/lib/auth-forms.ts
import type { Role } from "@/generated/prisma/enums";

/** Odgovor forme za prijavu, lozinku i korisnike: greška, poruka uspeha ili greške po poljima. */
export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Lozinka je ispravna, nalog ima 2FA: forma prikazuje polje za kod. */
  twoFactor?: boolean;
  /** Uneto, da se polje ne isprazni posle greške. */
  values?: Record<string, string>;
} | null;

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  AFFILIATE: "Partner",
  CLIENT: "Kupac",
};

export const PASSWORD_MIN = 10;