import {
  Divider,
  EmailHeading,
  EmailLayout,
  firstName,
  greeting,
  InfoRow,
  Paragraph,
  Signature,
} from "./components";
import { NextSteps, OrderAddress, OrderItems } from "./order-parts";
import { SAMPLE_ORDER, type EmailOrder } from "./types";

export const orderConfirmationSubject = (order: EmailOrder) => `Potvrda porudžbine ${order.number}`;

/** Kupcu, odmah posle porudžbine. */
export function OrderConfirmationEmail({ order }: { order: EmailOrder }) {
  return (
    <EmailLayout
      preview={`Porudžbina ${order.number} je primljena i nalazi se u obradi.`}
      reason="Ovaj mejl ste primili jer ste poručili na monahome.rs."
    >
      <EmailHeading label="Potvrda porudžbine">Porudžbina je primljena</EmailHeading>

      <Paragraph style={{ marginTop: "32px" }}>{greeting(firstName(order.fullName))}</Paragraph>
      <Paragraph>
        Vaša porudžbina je primljena i nalazi se u obradi. Pre slanja ćemo Vas kontaktirati telefonom radi potvrde. U
        nastavku se nalazi pregled porudžbine.
      </Paragraph>

      <InfoRow
        items={[
          { label: "Porudžbina", value: order.number },
          { label: "Datum", value: order.date },
          { label: "Plaćanje", value: "Pouzećem" },
        ]}
      />

      <OrderItems order={order} />
      <Divider />
      <OrderAddress order={order} />
      <Divider />
      <NextSteps />

      <Signature />
    </EmailLayout>
  );
}

OrderConfirmationEmail.PreviewProps = { order: SAMPLE_ORDER };