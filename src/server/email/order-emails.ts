import "server-only";

import { formatOrderNumber, formatRsd } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { getOrderById, type OrderDetail } from "@/server/orders";

import { sendEmail } from "./send";

// Boje brenda; mejl klijenti ne čitaju CSS promenljive, pa su vrednosti upisane direktno.
const C = { kamen: "#e7e0d5", kamenSvetli: "#efeae2", espreso: "#2a211d", taupe: "#6e6053", linija: "#c9beae" };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Helvetica, Arial, sans-serif";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function itemsTable(order: OrderDetail, withSku: boolean) {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${C.linija};font-family:${SANS};font-size:14px;color:${C.espreso}">
          ${escape(item.productName)}
          ${item.variantLabel ? `<br><span style="color:${C.taupe};font-size:13px">${escape(item.variantLabel)}</span>` : ""}
          ${withSku ? `<br><span style="color:${C.taupe};font-size:12px">${escape(item.sku)}</span>` : ""}
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${C.linija};font-family:${SANS};font-size:14px;color:${C.taupe};text-align:center;white-space:nowrap">× ${item.quantity}</td>
        <td style="padding:14px 0;border-bottom:1px solid ${C.linija};font-family:${SANS};font-size:14px;color:${C.espreso};text-align:right;white-space:nowrap">${formatRsd(item.lineTotalRsd)}</td>
      </tr>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${C.linija}">
      ${rows}
      <tr>
        <td colspan="2" style="padding:16px 0 4px;font-family:${SANS};font-size:13px;color:${C.taupe}">Međuzbir</td>
        <td style="padding:16px 0 4px;font-family:${SANS};font-size:14px;color:${C.espreso};text-align:right">${formatRsd(order.subtotalRsd)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0;font-family:${SANS};font-size:13px;color:${C.taupe}">Dostava</td>
        <td style="padding:4px 0;font-family:${SANS};font-size:13px;color:${C.taupe};text-align:right">${order.shippingRsd > 0 ? formatRsd(order.shippingRsd) : "Pri preuzimanju"}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:12px 0 0;font-family:${SANS};font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${C.espreso}">Ukupno</td>
        <td style="padding:12px 0 0;font-family:${SANS};font-size:16px;font-weight:bold;color:${C.espreso};text-align:right">${formatRsd(order.totalRsd)}</td>
      </tr>
    </table>`;
}

function addressBlock(order: OrderDetail) {
  return `
    <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.espreso}">
      ${escape(order.fullName)}<br>
      ${escape(order.address)}<br>
      ${escape(order.postalCode)} ${escape(order.city)}<br>
      ${escape(order.phone)}
    </p>
    ${order.note ? `<p style="margin:12px 0 0;font-family:${SANS};font-size:13px;color:${C.taupe}">Napomena: ${escape(order.note)}</p>` : ""}`;
}

function layout(preheader: string, body: string) {
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
          </td></tr>          <tr><td style="background:${C.kamenSvetli};padding:40px 32px">${body}</td></tr>
          <tr><td style="padding:24px 0 0;font-family:${SANS};font-size:12px;color:${C.taupe}">
            monahome · <a href="${SITE_URL}" style="color:${C.taupe}">monahome.rs</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const heading = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:32px;font-weight:normal;font-style:italic;color:${C.espreso}">${text}</h1>`;
const label = (text: string) =>
  `<p style="margin:32px 0 12px;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.taupe}">${text}</p>`;

function customerEmail(order: OrderDetail) {
  const number = formatOrderNumber(order.number);
  const html = layout(
    `Porudžbina ${number} je primljena.`,
    `
      ${label(`Porudžbina ${number}`)}
      ${heading("Hvala vam.")}
      <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.espreso}">
        Primili smo vašu porudžbinu i pripremamo je sa pažnjom. Javićemo vam se kada pošiljka krene.
        Plaćanje je pouzećem, kuriru pri preuzimanju.
      </p>
      ${label("Vaša porudžbina")}
      ${itemsTable(order, false)}
      ${label("Dostava na adresu")}
      ${addressBlock(order)}
      <p style="margin:32px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.taupe}">
        Imate pitanje? Samo odgovorite na ovaj mejl.
      </p>`,
  );

  const text = [
    `Hvala vam. Porudžbina ${number} je primljena.`,
    "",
    ...order.items.map(
      (item) =>
        `${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity}: ${formatRsd(item.lineTotalRsd)}`,
    ),
    "",
    `Ukupno: ${formatRsd(order.totalRsd)} (dostava se plaća pri preuzimanju)`,
    "",
    "Dostava na adresu:",
    order.fullName,
    order.address,
    `${order.postalCode} ${order.city}`,
    order.phone,
  ].join("\n");

  return { subject: `Porudžbina ${number} je primljena`, html, text };
}

function adminEmail(order: OrderDetail) {
  const number = formatOrderNumber(order.number);
  const html = layout(
    `${order.fullName}, ${formatRsd(order.totalRsd)}`,
    `
      ${label("Nova porudžbina")}
      ${heading(number)}
      <p style="margin:0;font-family:${SANS};font-size:15px;color:${C.espreso}">
        ${escape(order.fullName)} · <a href="mailto:${escape(order.email)}" style="color:${C.espreso}">${escape(order.email)}</a>
      </p>
      ${label("Stavke")}
      ${itemsTable(order, true)}
      ${label("Dostava")}
      ${addressBlock(order)}`,
  );

  const text = [
    `Nova porudžbina ${number}`,
    `${order.fullName} · ${order.email} · ${order.phone}`,
    "",
    ...order.items.map(
      (item) =>
        `${item.sku}  ${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity}: ${formatRsd(item.lineTotalRsd)}`,
    ),
    "",
    `Ukupno: ${formatRsd(order.totalRsd)}`,
    `${order.address}, ${order.postalCode} ${order.city}`,
    order.note ? `Napomena: ${order.note}` : "",
  ].join("\n");

  return { subject: `Nova porudžbina ${number} · ${formatRsd(order.totalRsd)}`, html, text };
}

/** Potvrda kupcu i obaveštenje prodavnici. Poziva se posle odgovora kupcu (`after`), ne usporava porudžbinu. */
export async function sendOrderEmails(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) return;

  const notify = process.env.ORDER_NOTIFY_EMAIL;
  await Promise.all([
    sendEmail({ to: order.email, ...customerEmail(order) }),
    notify ? sendEmail({ to: notify, replyTo: order.email, ...adminEmail(order) }) : Promise.resolve(),
  ]);
}