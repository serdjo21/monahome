import "server-only";

import { formatOrderNumber, formatRsd } from "@/lib/format";
import { getOrderById, type OrderDetail } from "@/server/orders";

import { C, escape, heading, label, layout, SANS } from "./layout";
import { sendEmail } from "./send";


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