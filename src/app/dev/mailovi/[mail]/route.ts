import { render } from "@react-email/components";

import { EMAIL_PREVIEWS } from "@/emails/previews";

/** Jedan mejl kao HTML stranica, tačno kako stiže kupcu. Postoji samo u lokalnom razvoju. */
export async function GET(_request: Request, { params }: RouteContext<"/dev/mailovi/[mail]">) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });

  const { mail } = await params;
  const preview = EMAIL_PREVIEWS[mail];
  if (!preview) return new Response("Ne postoji mejl sa tim nazivom.", { status: 404 });

  const html = await render(preview.render());
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}