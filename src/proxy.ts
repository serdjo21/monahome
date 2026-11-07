import { NextResponse, type NextRequest } from "next/server";

/**
 * „Sajt u izradi“: produkcija (monahome.rs) prikazuje /uskoro dok se ne doda SITE_LIVE=1.
 * Preview grane (development) i lokalni razvoj vide ceo sajt.
 * Lokalno se „uskoro“ testira sa: COMING_SOON=1 npm run dev
 */
function isComingSoon() {
  if (process.env.SITE_LIVE === "1") return false;
  return process.env.VERCEL_ENV === "production" || process.env.COMING_SOON === "1";
}

export function proxy(request: NextRequest) {
  if (!isComingSoon()) return NextResponse.next();
  if (request.nextUrl.pathname === "/uskoro") return NextResponse.next();
  return NextResponse.rewrite(new URL("/uskoro", request.url));
}

export const config = {
  // Ne diraj Next interne fajlove, slike, ikonice i fajlove sa ekstenzijom.
  matcher: ["/((?!_next/|api/|favicon.ico|icon.png|apple-icon.png|.*\\..*).*)"],
};