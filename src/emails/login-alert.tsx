// src/emails/login-alert.tsx
import {
  Divider,
  EmailHeading,
  EmailLayout,
  greeting,
  InfoRow,
  Paragraph,
  PrimaryButton,
  styles,
} from "./components";

export const loginAlertSubject = "Nova prijava na admin";

export type LoginAlertProps = {
  email: string;
  name: string | null;
  /** „23. 11. 2026. 01:45“, po beogradskom vremenu. */
  time: string;
  /** „Chrome · macOS“ */
  device: string;
  ip: string;
  /** Link za promenu lozinke (zaboravljena lozinka). */
  resetLink: string;
};

/** Obaveštenje administratoru posle svake uspešne prijave na admin. */
export function LoginAlertEmail({ email, name, time, device, ip, resetLink }: LoginAlertProps) {
  return (
    <EmailLayout
      minimal
      preview={`Prijava na admin: ${time}, ${device}.`}
      reason={`Ovaj mejl je poslat na ${email} jer je neko prijavljen na admin monahome sa ovim nalogom.`}
    >
      <EmailHeading label="Nalog">Nova prijava</EmailHeading>

      <Paragraph style={{ marginTop: "32px" }}>{greeting(name)}</Paragraph>
      <Paragraph>Upravo je zabeležena prijava na admin monahome sa Vašim nalogom.</Paragraph>

      <InfoRow
        items={[
          { label: "Vreme", value: time },
          { label: "Uređaj", value: device },
          { label: "IP adresa", value: ip },
        ]}
      />

      <Paragraph style={{ marginTop: "32px" }}>Ako ste se Vi prijavili, ne morate ništa da radite.</Paragraph>
      <Paragraph>
        Ako se niste Vi prijavili, odmah promenite lozinku. Nova lozinka odjavljuje nalog sa svih uređaja.
      </Paragraph>

      <PrimaryButton href={resetLink}>Promeni lozinku</PrimaryButton>

      <Divider />
      <Paragraph style={styles.muted}>Ovaj mejl stiže posle svake prijave na admin i ne može se isključiti.</Paragraph>
    </EmailLayout>
  );
}

LoginAlertEmail.PreviewProps = {
  email: "office@monahome.rs",
  name: "Sergej",
  time: "23. 11. 2026. 01:45",
  device: "Chrome · macOS",
  ip: "178.221.10.24",
  resetLink: "http://localhost:3000/lozinka/zaboravljena",
} satisfies LoginAlertProps;