import { Column, Img, Row, Section, Text } from "@react-email/components";

import { formatRsd } from "@/lib/format";

import { C, noAutoLink, SERIF, styles } from "./components";
import type { EmailOrder } from "./types";

/** Stavke sa malom fotografijom, pa međuzbir, dostava i ukupno. */
export function OrderItems({ order, showSku = false }: { order: EmailOrder; showSku?: boolean }) {
  return (
    <Section>
      {order.items.map((item, index) => (
        <Row key={`${item.sku}-${index}`} style={{ borderBottom: `1px solid ${C.linija}` }}>
          <Column style={{ width: "72px", padding: "16px 16px 16px 0", verticalAlign: "top" }}>
            {item.imageUrl ? (
              <Img src={item.imageUrl} width="56" height="70" alt="" style={{ display: "block", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "56px", height: "70px", backgroundColor: C.kamen }} />
            )}
          </Column>
          <Column style={{ padding: "16px 0", verticalAlign: "top" }}>
            <Text style={{ ...styles.text, fontFamily: SERIF, fontSize: "16px" }}>{item.name}</Text>
            <Text style={{ ...styles.muted, marginTop: "2px" }}>
              {[item.variantLabel, `Količina: ${item.quantity}`].filter(Boolean).join(" · ")}
            </Text>
            {showSku ? <Text style={{ ...styles.muted, fontSize: "12px", marginTop: "2px" }}>{item.sku}</Text> : null}
          </Column>
          <Column style={{ width: "110px", padding: "16px 0", verticalAlign: "top", textAlign: "right" }}>
            <Text style={{ ...styles.text, fontSize: "14px", whiteSpace: "nowrap" }}>{noAutoLink(formatRsd(item.lineTotalRsd))}</Text>
          </Column>
        </Row>
      ))}

      <Row style={{ marginTop: "16px" }}>
        <Column>
          <Text style={styles.muted}>Međuzbir</Text>
        </Column>
        <Column style={{ textAlign: "right" }}>
          <Text style={{ ...styles.text, fontSize: "14px" }}>{noAutoLink(formatRsd(order.subtotalRsd))}</Text>
        </Column>
      </Row>
      <Row style={{ marginTop: "4px" }}>
        <Column>
          <Text style={styles.muted}>Dostava</Text>
        </Column>
        <Column style={{ textAlign: "right" }}>
          <Text style={styles.muted}>{order.shippingRsd > 0 ? noAutoLink(formatRsd(order.shippingRsd)) : "Plaća se pri preuzimanju"}</Text>
        </Column>
      </Row>
      <Row style={{ marginTop: "12px", borderTop: `1px solid ${C.linija}` }}>
        <Column style={{ paddingTop: "12px" }}>
          <Text style={{ ...styles.label, color: C.espreso }}>Ukupno</Text>
        </Column>
        <Column style={{ paddingTop: "12px", textAlign: "right" }}>
          <Text style={{ ...styles.text, fontSize: "17px", fontWeight: "bold" }}>{noAutoLink(formatRsd(order.totalRsd))}</Text>
        </Column>
      </Row>
    </Section>
  );
}

/** Adresa za dostavu i kontakt kupca, u dve kolone. */
export function OrderAddress({ order }: { order: EmailOrder }) {
  return (
    <Section>
      <Row>
        <Column style={{ width: "50%", verticalAlign: "top", paddingRight: "16px" }}>
          <Text style={{ ...styles.label, marginBottom: "8px" }}>Adresa za dostavu</Text>
          <Text style={styles.text}>
            {order.fullName}
            <br />
            {noAutoLink(order.address)}
            <br />
            {noAutoLink(`${order.postalCode} ${order.city}`)}
          </Text>
        </Column>
        <Column style={{ width: "50%", verticalAlign: "top" }}>
          <Text style={{ ...styles.label, marginBottom: "8px" }}>Kontakt</Text>
          <Text style={styles.text}>
            {noAutoLink(order.phone)}
            <br />
            {order.email}
          </Text>
        </Column>
      </Row>
      {order.note ? (
        <Text style={{ ...styles.muted, marginTop: "16px" }}>
          <span style={{ color: C.espreso }}>Napomena:</span> {order.note}
        </Text>
      ) : null}
    </Section>
  );
}

/** „Šta sledi“: tri koraka do isporuke, bez numeracije, odvojeni linijama. */
export function NextSteps() {
  const steps = [
    { title: "Potvrda", text: "Kontaktiraćemo Vas telefonom u roku od jednog radnog dana radi potvrde porudžbine." },
    { title: "Slanje", text: "Kada pošiljka krene, dobićete mejl sa brojem pošiljke." },
    { title: "Isporuka", text: "Kurir isporučuje u roku od 2 do 4 radna dana. Plaćanje se vrši pri preuzimanju." },
  ];
  return (
    <Section>
      <Text style={{ ...styles.label, marginBottom: "8px" }}>Šta sledi</Text>
      {steps.map((step) => (
        <Row key={step.title} style={{ borderTop: `1px solid ${C.linija}` }}>
          <Column style={{ width: "96px", padding: "14px 0", verticalAlign: "top" }}>
            <Text style={{ ...styles.text, fontFamily: SERIF, fontSize: "15px" }}>{step.title}</Text>
          </Column>
          <Column style={{ padding: "14px 0", verticalAlign: "top" }}>
            <Text style={{ ...styles.muted, fontSize: "14px", lineHeight: "22px" }}>{step.text}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}