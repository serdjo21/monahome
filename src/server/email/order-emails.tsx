import "server-only";

import { render } from "@react-email/components";
import type { ReactElement } from "react";

import { OrderConfirmationEmail, orderConfirmationSubject } from "@/emails/order-confirmation";
import { OrderNotificationEmail, orderNotificationSubject } from "@/emails/order-notification";
import { OrderShippedEmail, orderShippedSubject } from "@/emails/order-shipped";
import type { EmailOrder } from "@/emails/types";
import { formatDate } from "@/lib/admin-format";
import { formatOrderNumber } from "@/lib/format";
import { appOrigin, SITE_URL } from "@/lib/site";
import { getOrderById, type OrderDetail } from "@/server/orders";
import { mediaUrl } from "@/server/storefront/media";

import { sendEmail } from "./send";

/** Mejl otvara slike sa interneta, pa putanja mora biti apsolutna. */
function absoluteImage(path: string | null | undefined): string | null {
  const url = mediaUrl(path);
  if (!url) return null;
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}

export function toEmailOrder(order: OrderDetail): EmailOrder {
  return {
    id: order.id,
    number: formatOrderNumber(order.number),
    date: formatDate(order.createdAt),
    fullName: order.fullName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    postalCode: order.postalCode,
    city: order.city,
    note: order.note,
    subtotalRsd: order.subtotalRsd,
    shippingRsd: order.shippingRsd,
    totalRsd: order.totalRsd,
    items: order.items.map((item) => ({
      name: item.productName,
      variantLabel: item.variantLabel,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceRsd: item.unitPriceRsd,
      lineTotalRsd: item.lineTotalRsd,
      imageUrl: absoluteImage(item.variant?.images[0]?.path ?? item.variant?.product.images[0]?.path),
    })),
  };
}

/** HTML i obična tekstualna verzija istog mejla (neki klijenti i filteri za spam čitaju samo tekst). */
export async function renderEmail(element: ReactElement) {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}

/** Potvrda kupcu i obaveštenje prodavnici. Poziva se posle odgovora kupcu (`after`), ne usporava porudžbinu. */
export async function sendOrderEmails(orderId: string): Promise<void> {
  const record = await getOrderById(orderId);
  if (!record) return;
  const order = toEmailOrder(record);

  const notify = process.env.ORDER_NOTIFY_EMAIL;
  await Promise.all([
    sendEmail({
      to: order.email,
      subject: orderConfirmationSubject(order),
      ...(await renderEmail(<OrderConfirmationEmail order={order} />)),
    }),
    notify
          
      ? sendEmail({
          to: notify,
          subject: orderNotificationSubject(order),
          ...(await renderEmail(
            <OrderNotificationEmail order={order} adminUrl={`${appOrigin()}/admin/porudzbine/${order.id}`} />,
          )),
        })
      : Promise.resolve(),
  ]);
}

/** Kupcu, kad se porudžbina u adminu označi kao poslata (koristi se u adminu → Porudžbine). */
export async function sendOrderShippedEmail(orderId: string, trackingNumber?: string | null, courier?: string | null) {
  const record = await getOrderById(orderId);
  if (!record) return;
  const order = toEmailOrder(record);

  await sendEmail({
    to: order.email,
    subject: orderShippedSubject(order),
    ...(await renderEmail(<OrderShippedEmail order={order} trackingNumber={trackingNumber} courier={courier} />)),
  });
}