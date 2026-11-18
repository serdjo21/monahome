import {
  Divider,
  EmailHeading,
  EmailLayout,
  greeting,
  Paragraph,
  PrimaryButton,
  Signature,
  styles,
} from "./components";

export const passwordResetSubject = "Promena lozinke";

/** Zaboravljena lozinka. Link važi 60 minuta. */
export function PasswordResetEmail({ link, email, name }: { link: string; email: string; name: string | null }) {
  return (
    <EmailLayout
      minimal
      preview="Link za promenu lozinke Vašeg naloga."
      reason={`Ovaj mejl je poslat na ${email} na zahtev za promenu lozinke.`}
    >
      <EmailHeading label="Nalog">Promena lozinke</EmailHeading>

      <Paragraph style={{ marginTop: "32px" }}>{greeting(name)}</Paragraph>
      <Paragraph>
        Primili smo zahtev za promenu lozinke za nalog povezan sa adresom {email}. Lozinku možete promeniti putem
        dugmeta ispod.
      </Paragraph>

      <PrimaryButton href={link}>Promeni lozinku</PrimaryButton>

      <Paragraph style={{ ...styles.muted, textAlign: "center", marginTop: "16px" }}>
        Link važi 60 minuta i može se iskoristiti samo jednom.
      </Paragraph>

      <Divider />
      <Paragraph style={styles.muted}>
        Ukoliko niste Vi poslali zahtev, ovaj mejl možete zanemariti. Vaša lozinka ostaje nepromenjena.
      </Paragraph>

      <Signature />
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  link: "http://localhost:3000/lozinka/nova?token=primer",
  email: "danaja@primer.rs",
  name: "Danaja",
};