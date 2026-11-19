import {
  Body,
  Button as EmailButton,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import { CONTACT } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";

/**
 * Zajednički delovi svih mejlova. Mejl klijenti ne poznaju CSS promenljive ni naše fontove,
 * pa su boje upisane direktno, a Bodoni zamenjuje Georgia (serif koji ima svaki uređaj).
 */
export const C = {
  kamen: "#e7e0d5",
  kamenSvetli: "#efeae2",
  espreso: "#2a211d",
  taupe: "#6e6053",
  linija: "#d6ccbd",
  bordo: "#6b2a25",
} as const;

export const SERIF = "Georgia, 'Times New Roman', serif";
export const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const text: CSSProperties = { fontFamily: SANS, fontSize: "15px", lineHeight: "24px", color: C.espreso, margin: 0 };

export const styles = {
  text,
  muted: { ...text, fontSize: "13px", lineHeight: "20px", color: C.taupe },
  label: {
    fontFamily: SANS,
    fontSize: "10px",
    lineHeight: "16px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: C.taupe,
    margin: 0,
  } satisfies CSSProperties,
} as const;

type LayoutProps = {
  /** Tekst koji se vidi u inboxu pored naslova, pre otvaranja mejla. */
  preview: string;
  /** Zašto je mejl stigao; ide u futer. */
  reason: string;
  /** Mejlovi o nalogu: futer bez linkova ka prodavnici i mrežama, da Gmail ne misli da je reklama. */
  minimal?: boolean;
  children: ReactNode;
};

/** Okvir: espreso traka sa logom, svetla kartica sa sadržajem, futer sa kontaktom i linkovima. */
export function EmailLayout({ preview, reason, minimal = false, children }: LayoutProps) {
  return (
    <Html lang="sr-Latn">
      <Head>
        {/* Apple Mail: bez automatskog tamnog režima i bez plavih linkova na adresama i brojevima. */}
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <meta name="format-detection" content="telephone=no, address=no, email=no, date=no" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: C.kamen, margin: 0, padding: 0 }}>
        {/* Gmail briše stil sa <body>, pa boju pozadine nosi tabela preko cele širine; inače ostaje beli okvir. */}
        <Section style={{ width: "100%", backgroundColor: C.kamen, padding: "24px 8px" }}>
          <Container style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
            <Section style={{ backgroundColor: C.espreso, padding: "36px 24px", textAlign: "center" }}>
              <Link href={SITE_URL}>
                <Img
                  src={`${SITE_URL}/email/monahome-wordmark-light.png`}
                  width="150"
                  height="33"
                  alt="monahome"
                  style={{ display: "inline-block", border: 0 }}
                />
              </Link>
            </Section>

            <Section style={{ backgroundColor: C.kamenSvetli, padding: "48px 40px" }}>{children}</Section>

            <Section style={{ padding: "32px 24px 8px", textAlign: "center" }}>
              {minimal ? null : (
                <Text style={{ ...styles.muted, fontSize: "12px", marginBottom: "8px" }}>
                  <Link href={`${SITE_URL}/dostava`} style={{ color: C.taupe }}>
                    Dostava
                  </Link>
                  {"  ·  "}
                  <Link href={`${SITE_URL}/reklamacije-i-povracaj`} style={{ color: C.taupe }}>
                    Reklamacije i povraćaj
                  </Link>
                  {"  ·  "}
                  <Link href={`${SITE_URL}/uslovi-koriscenja`} style={{ color: C.taupe }}>
                    Uslovi kupovine
                  </Link>
                </Text>
              )}
              <Text style={{ ...styles.muted, fontSize: "12px" }}>
                <Link href={`mailto:${CONTACT.email}`} style={{ color: C.taupe, textDecoration: "none" }}>
                  {CONTACT.email}
                </Link>
                {"  ·  "}
                <Link href={CONTACT.phoneHref} style={{ color: C.taupe, textDecoration: "none" }}>
                  {CONTACT.phone}
                </Link>
                {minimal ? null : (
                  <>
                    {"  ·  "}
                    <Link href={CONTACT.instagram} style={{ color: C.taupe, textDecoration: "none" }}>
                      Instagram
                    </Link>
                  </>
                )}
              </Text>
              <Text style={{ ...styles.muted, fontSize: "11px", marginTop: "16px", color: "#8a7d70" }}>{reason}</Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

/** Naslov mejla: uspravan serif, centriran, sa malom oznakom iznad. */
export function EmailHeading({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <Section style={{ textAlign: "center", paddingBottom: "8px" }}>
      {label ? <Text style={{ ...styles.label, marginBottom: "16px" }}>{label}</Text> : null}
      <Text
        style={{
          fontFamily: SERIF,
          fontSize: "30px",
          lineHeight: "38px",
          fontWeight: "normal",
          color: C.espreso,
          margin: 0,
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

export function Paragraph({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <Text style={{ ...text, marginTop: "16px", ...style }}>{children}</Text>;
}

export function Divider({ spacing = 32 }: { spacing?: number }) {
  return <Hr style={{ borderColor: C.linija, borderTopWidth: "1px", margin: `${spacing}px 0` }} />;
}

export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ textAlign: "center", padding: "32px 0 8px" }}>
      <EmailButton
        href={href}
        style={{
          backgroundColor: C.espreso,
          color: C.kamenSvetli,
          fontFamily: SANS,
          fontSize: "12px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          textDecoration: "none",
          padding: "16px 32px",
        }}
      >
        {children}
      </EmailButton>
    </Section>
  );
}

/** Red sa ključnim podacima (npr. broj porudžbine · datum · plaćanje), u kolonama jednake širine. */
export function InfoRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <Section
      style={{
        borderTop: `1px solid ${C.linija}`,
        borderBottom: `1px solid ${C.linija}`,
        padding: "20px 0",
        marginTop: "32px",
      }}
    >
      <Row>
        {items.map((item) => (
          <Column
            key={item.label}
            style={{ width: `${100 / items.length}%`, textAlign: "center", verticalAlign: "top" }}
          >
            <Text style={styles.label}>{item.label}</Text>
            <Text style={{ ...text, fontSize: "14px", marginTop: "4px" }}>{item.value}</Text>
          </Column>
        ))}
      </Row>
    </Section>
  );
}

/** Potpis na kraju mejlova kupcu. */
export function Signature() {
  return (
    <>
      <Paragraph style={{ marginTop: "32px" }}>
        Za sva pitanja stojimo Vam na raspolaganju na{" "}
        <Link href={`mailto:${CONTACT.email}`} style={{ color: C.espreso }}>
          {CONTACT.email}
        </Link>{" "}
        ili{" "}
        <Link href={CONTACT.phoneHref} style={{ color: C.espreso, whiteSpace: "nowrap" }}>
          {CONTACT.phone}
        </Link>
        .
      </Paragraph>
      <Paragraph style={{ marginTop: "24px" }}>
        Srdačan pozdrav,
        <br />
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "18px" }}>monahome</span>
      </Paragraph>
    </>
  );
}

/**
 * Gmail i iOS same pretvaraju adrese i brojeve u plave linkove.
 * Nevidljivi razmak posle svake cifre to sprečava, a tekst izgleda isto.
 */
export function noAutoLink(value: string): string {
  return value.replace(/(\d)/g, "$1\u200C");
}

/** „Danaja Maras“ → „Danaja“, za obraćanje „Dobar dan, Danaja,“. */
export function firstName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? first : null;
}

export const greeting = (name: string | null) => (name ? `Dobar dan, ${name},` : "Dobar dan,");