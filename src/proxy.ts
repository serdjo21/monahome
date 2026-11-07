import { NextResponse, type NextRequest } from "next/server";

/**
 * „Sajt u izradi“: kad je COMING_SOON=1 (podešeno samo za Production na Vercelu),
 * svaka stranica prikazuje /uskoro. Preview (development grana) i lokalni razvoj vide ceo sajt.
 */
export function proxy(request: NextRequest) {
  if (process.env.COMING_SOON !== "1") return NextResponse.next();
  if (request.nextUrl.pathname === "/uskoro") return NextResponse.next();
  return NextResponse.rewrite(new URL("/uskoro", request.url));
}

export const config = {
  // Ne diraj Next interne fajlove, slike, ikonice i fajlove sa ekstenzijom.
  matcher: ["/((?!_next/|api/|favicon.ico|icon.png|apple-icon.png|.*\\..*).*)"],
};