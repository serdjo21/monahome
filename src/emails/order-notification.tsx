import { Link, Text } from "@react-email/components";

import { formatRsd } from "@/lib/format";

import { C, Divider, EmailHeading, EmailLayout, InfoRow, noAutoLink, PrimaryButton, styles } from "./components";
import { OrderAddress, OrderItems } from "./order-parts";
import { SAMPLE_ORDER, type EmailOrder } from "./types";

export const orderNotificationSubject = (order: EmailOrder) =>
  `Nova porudžbina ${order.number} · ${formatRsd(order.totalRsd)}`;

/** Prodavnici (tebi): sve za obradu na jednom mestu, uz šifre artikala i dugme ka adminu. */
export function OrderNotificationEmail({ order, adminUrl }: { order: EmailOrder; adminUrl: string }) {
  return (
    <EmailLayout
      preview={`${order.fullName} · ${formatRsd(order.totalRsd)} · ${order.city}`}
      reason="Interno obaveštenje prodavnice monahome."
    >
      <EmailHeading label="Nova porudžbina">{order.number}</EmailHeading>

      <InfoRow
        items={[
          { label: "Datum", value: order.date },
          { label: "Iznos", value: noAutoLink(formatRsd(order.totalRsd)) },
          { label: "Plaćanje", value: "Pouzećem" },
        ]}
      />

      <Text style={{ ...styles.text, marginTop: "24px", textAlign: "center" }}>
        {order.fullName} ·{" "}
        <Link href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} style={{ color: C.espreso }}>
          {order.phone}
        </Link>
      </Text>

      <Divider spacing={24} />
      <OrderItems order={order} showSku />
      <Divider />
      <OrderAddress order={order} />

      <PrimaryButton href={adminUrl}>Otvori porudžbinu</PrimaryButton>
    </EmailLayout>
  );
}

OrderNotificationEmail.PreviewProps = { order: SAMPLE_ORDER, adminUrl: "http://localhost:3000/admin" };