import { Text } from "@react-email/components";

import {
  Divider,
  EmailHeading,
  EmailLayout,
  firstName,
  greeting,
  InfoRow,
  Paragraph,
  Signature,
  styles,
} from "./components";
import { OrderItems } from "./order-parts";
import { SAMPLE_ORDER, type EmailOrder } from "./types";

export const orderShippedSubject = (order: EmailOrder) => `Porudžbina ${order.number} je poslata`;

type Props = {
  order: EmailOrder;
  /** Broj pošiljke kurirske službe, ako je upisan u adminu. */
  trackingNumber?: string | null;
  courier?: string | null;
};

/** Kupcu, kada se porudžbina u adminu označi kao poslata. */
export function OrderShippedEmail({ order, trackingNumber, courier }: Props) {
  return (
    <EmailLayout
      preview={`Porudžbina ${order.number} je predata kurirskoj službi.`}
      reason="Ovaj mejl ste primili jer ste poručili na monahome.rs."
    >
      <EmailHeading label={`Porudžbina ${order.number}`}>Pošiljka je na putu</EmailHeading>

      <Paragraph style={{ marginTop: "32px" }}>{greeting(firstName(order.fullName))}</Paragraph>
      <Paragraph>
        Vaša porudžbina je predata kurirskoj službi. Isporuka se očekuje u roku od 2 do 4 radna dana, a kurir će Vas
        kontaktirati pre dolaska. Plaćanje se vrši pri preuzimanju.
      </Paragraph>

      {trackingNumber ? (
        <>
          <InfoRow
            items={[
              ...(courier ? [{ label: "Kurirska služba", value: courier }] : []),
              { label: "Broj pošiljke", value: trackingNumber },
            ]}
          />
          <Text style={{ ...styles.muted, textAlign: "center", marginTop: "12px" }}>
            Status pošiljke možete pratiti na sajtu kurirske službe.
          </Text>
        </>
      ) : null}

      <Divider />
      <OrderItems order={order} />

      <Signature />
    </EmailLayout>
  );
}

OrderShippedEmail.PreviewProps = { order: SAMPLE_ORDER, trackingNumber: "RS123456789", courier: "Post Express" };