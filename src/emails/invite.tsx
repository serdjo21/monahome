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

export const inviteSubject = "Aktivacija naloga na monahome.rs";

type Props = {
  link: string;
  email: string;
  name: string | null;
  /** „partnera“, „administratora“… (padež za rečenicu „sa ulogom …“) */
  roleLabel: string;
};

/** Nalog koji je napravio administrator. Link važi sedam dana. */
export function InviteEmail({ link, email, name, roleLabel }: Props) {
  return (
    <EmailLayout
      minimal
      preview="Za Vas je kreiran nalog na monahome.rs."
      reason={`Ovaj mejl je poslat na ${email} jer je za ovu adresu kreiran nalog.`}
    >
      <EmailHeading label="Nalog">Aktivacija naloga</EmailHeading>

      <Paragraph style={{ marginTop: "32px" }}>{greeting(name)}</Paragraph>
      <Paragraph>
        Za Vas je kreiran nalog na monahome.rs sa ulogom {roleLabel}. Da biste aktivirali nalog, postavite lozinku putem
        dugmeta ispod.
      </Paragraph>

      <PrimaryButton href={link}>Postavi lozinku</PrimaryButton>

      <Paragraph style={{ ...styles.muted, textAlign: "center", marginTop: "16px" }}>
        Link važi sedam dana i može se iskoristiti samo jednom.
      </Paragraph>

      <Divider />
      <Paragraph style={styles.muted}>Ukoliko ne očekujete ovaj poziv, mejl možete zanemariti.</Paragraph>

      <Signature />
    </EmailLayout>
  );
}

InviteEmail.PreviewProps = {
  link: "http://localhost:3000/lozinka/nova?token=primer",
  email: "partner@primer.rs",
  name: "Marija",
  roleLabel: "partnera",
};