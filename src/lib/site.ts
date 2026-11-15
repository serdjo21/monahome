/** Javna adresa sajta, za apsolutne linkove (strukturirani podaci, deljenje). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://monahome.rs").replace(/\/$/, "");

/**
 * Adresa za linkove u mejlovima (nova lozinka, pozivnica). Nikad se ne uzima iz zaglavlja zahteva,
 * da napadač ne može podmetnuti svoj domen u link: produkcija → SITE_URL, preview → adresa grane, lokalno → localhost.
 */
export function appOrigin(): string {
  if (process.env.VERCEL_ENV === "production") return SITE_URL;
  if (process.env.VERCEL_BRANCH_URL) return `https://${process.env.VERCEL_BRANCH_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}