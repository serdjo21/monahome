// src/server/turnstile.ts
import "server-only";

import { headers } from "next/headers";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Naziv forme; isti naziv šalje i widget (prop `action`), pa token sa prijave ne prolazi na plaćanju. */
export type TurnstileAction = "checkout" | "login" | "password_reset";

type VerifyResponse = {
  success: boolean;
  action?: string;
  "error-codes"?: string[];
};

/**
 * Proverava Cloudflare Turnstile token iz forme (polje „cf-turnstile-response“, widget ga sam dodaje).
 * - Bez TURNSTILE_SECRET_KEY: na produkciji odbija (greška u podešavanju), lokalno i na preview-u propušta.
 * - Cloudflare nedostupan (mreža, timeout): propušta i beleži u log, da kvar kod njih ne zaustavi prodaju.
 *   Ostale zaštite (honeypot, limit prijava) i dalje rade.
 */
export async function verifyTurnstile(formData: FormData, action: TurnstileAction): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.VERCEL_ENV === "production") {
      console.error("[turnstile] TURNSTILE_SECRET_KEY nije postavljen.");
      return false;
    }
    return true;
  }

  const token = formData.get("cf-turnstile-response");
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  let data: VerifyResponse;
  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      console.error("[turnstile] Cloudflare je vratio", response.status);
      return true;
    }
    data = (await response.json()) as VerifyResponse;
  } catch (error) {
    console.error("[turnstile] Cloudflare nije dostupan:", error);
    return true;
  }

  if (!data.success) {
    console.warn(`[turnstile] Odbijeno (${action}):`, data["error-codes"]);
    return false;
  }
  // Test ključevi ne vraćaju action, pa se poredi samo kad postoji.
  if (data.action && data.action !== action) {
    console.warn(`[turnstile] Pogrešna forma: očekivano ${action}, stiglo ${data.action}`);
    return false;
  }
  return true;
}