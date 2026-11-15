import "server-only";

import { SITE_URL } from "@/lib/site";

// Boje brenda; mejl klijenti ne čitaju CSS promenljive, pa su vrednosti upisane direktno.
export const C = { kamen: "#e7e0d5", kamenSvetli: "#efeae2", espreso: "#2a211d", taupe: "#6e6053", linija: "#c9beae" };
export const SERIF = "Georgia, 'Times New Roman', serif";
export const SANS = "Helvetica, Arial, sans-serif";

export const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function layout(preheader: string, body: string) {
  return `<!doctype html>
<html lang="sr-Latn">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;padding:0;background:${C.kamen}">
    <span style="display:none;max-height:0;overflow:hidden">${escape(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.kamen}">
      <tr><td align="center" style="padding:40px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <tr><td style="padding:0 0 32px">
            <a href="${SITE_URL}"><img src="${SITE_URL}/email/monahome-wordmark.png" width="140" height="33" alt="monahome" style="display:block;border:0;width:140px;height:auto"></a>
          </td></tr>
          <tr><td style="background:${C.kamenSvetli};padding:40px 32px">${body}</td></tr>
          <tr><td style="padding:24px 0 0;font-family:${SANS};font-size:12px;color:${C.taupe}">
            monahome · <a href="${SITE_URL}" style="color:${C.taupe}">monahome.rs</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export const heading = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:32px;font-weight:normal;font-style:italic;color:${C.espreso}">${text}</h1>`;
export const label = (text: string) =>
  `<p style="margin:32px 0 12px;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.taupe}">${text}</p>`;

/** Dugme kao tabela (jedino što pouzdano radi u Outlooku i Gmailu). */
export const button = (href: string, text: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0">
    <tr><td style="background:${C.espreso}">
      <a href="${escape(href)}" style="display:inline-block;padding:15px 28px;font-family:${SANS};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.kamenSvetli};text-decoration:none">${escape(text)}</a>
    </td></tr>
  </table>`;