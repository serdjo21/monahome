import { NextResponse, type NextRequest } from "next/server";

/**
 * „Sajt u izradi“: na produkciji (main) svaka stranica prodavnice prikazuje /uskoro,
 * dok ne postavimo SITE_LIVE=1. Preview (development) i lokalni razvoj vide ceo sajt.
 */
function isComingSoon() {
  if (process.env.SITE_LIVE === "1") return false;
  return process.env.VERCEL_ENV === "production" || process.env.COMING_SOON === "1";
}

// Admin i nalog rade i pre otvaranja: prodavnica se uređuje pre nego što je kupci vide.
const ALWAYS_OPEN = ["/uskoro", "/admin", "/prijava", "/lozinka"];

export function proxy(request: NextRequest) {
  if (!isComingSoon()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (ALWAYS_OPEN.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL("/uskoro", request.url));
}

export const config = {
  // Ne diraj Next interne fajlove, API (uključujući /api/auth), ikonice i fajlove sa ekstenzijom.
  matcher: ["/((?!_next/|api/|favicon.ico|icon.png|apple-icon.png|.*\\..*).*)"],
};