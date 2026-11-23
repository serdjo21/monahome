// src/auth.ts
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { scheduleLoginAlert } from "@/server/auth/login-alert";
import { verifyPassword } from "@/server/auth/password";
import { verifySecondFactor } from "@/server/auth/two-factor";
import { prisma } from "@/server/db";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
  /** Kod iz aplikacije (6 cifara) ili rezervni kod; samo za naloge sa uključenim 2FA. */
  code: z.string().trim().max(20).optional(),
});

/** Lozinka je ispravna, ali nalog ima 2FA, a kod nije poslat: forma traži kod. */
export class TwoFactorRequired extends CredentialsSignin {
  code = "2fa_required";
}

/** Kod nije ispravan (ili je već iskorišćen). */
export class TwoFactorInvalid extends CredentialsSignin {
  code = "2fa_invalid";
}

/**
 * Prijava mejlom i lozinkom (Auth.js v5), uz kod iz aplikacije za administratore.
 * Sesija je potpisan JWT u kolačiću; uloga, aktivnost i 2FA se pri svakom pristupu adminu
 * ipak proveravaju u bazi (server/auth/guard.ts).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/prijava" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, code: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, code } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            passwordHash: true,
            sessionVersion: true,
            totpEnabledAt: true,
          },
        });
        const valid = await verifyPassword(password, user?.passwordHash);
        if (!user || !user.isActive || !valid) {
          await prisma.loginAttempt.create({ data: { email, success: false } });
          return null;
        }

        // Drugi korak: kod se traži tek posle ispravne lozinke. Pogrešan kod se broji kao neuspešan pokušaj
        // (isti limit od 5 pokušaja), pa se šestocifreni kod ne može pogađati.
        if (user.totpEnabledAt) {
          if (!code) throw new TwoFactorRequired();
          if (!(await verifySecondFactor(user.id, code))) {
            await prisma.loginAttempt.create({ data: { email, success: false } });
            throw new TwoFactorInvalid();
          }
        }

        await prisma.loginAttempt.create({ data: { email, success: true } });
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        // Administrator dobija mejl posle svake prijave, da odmah primeti tuđu.
        if (user.role === "ADMIN") await scheduleLoginAlert(user);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.sessionVersion = token.sessionVersion;
      return session;
    },
  },
});