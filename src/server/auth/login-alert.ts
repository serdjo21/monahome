// src/server/auth/login-alert.ts
import "server-only";

import { headers } from "next/headers";
import { after } from "next/server";

import { formatDateTime } from "@/lib/admin-format";
import { appOrigin } from "@/lib/site";
import { sendLoginAlertEmail } from "@/server/email/auth-emails";

/** „Chrome · macOS“ iz User-Agent zaglavlja. Grubo, ali dovoljno da se prepozna svoj uređaj. */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Nepoznat uređaj";
  const ua = userAgent;

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Pregledač";

  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Windows/.test(ua)
            ? "Windows"
            : /Linux/.test(ua)
              ? "Linux"
              : "nepoznat sistem";

  return `${browser} · ${os}`;
}

/**
 * Zakazuje mejl „Nova prijava na admin“ posle odgovora (ne usporava prijavu).
 * Poziva se samo posle potpuno uspešne prijave administratora.
 */
export async function scheduleLoginAlert(user: { email: string; name: string | null }) {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() || "nepoznata";
  const device = describeDevice(list.get("user-agent"));
  const time = formatDateTime(new Date());

  after(() =>
    sendLoginAlertEmail({
      email: user.email,
      name: user.name,
      time,
      device,
      ip,
      resetLink: `${appOrigin()}/lozinka/zaboravljena`,
    }),
  );
}