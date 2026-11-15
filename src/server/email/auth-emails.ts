import "server-only";

import { button, C, heading, label, layout, SANS } from "./layout";
import { sendEmail } from "./send";

const paragraph = (text: string) =>
  `<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.espreso}">${text}</p>`;
const small = (text: string) =>
  `<p style="margin:28px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.taupe}">${text}</p>`;

/** Link za novu lozinku (zaboravljena lozinka). Važi 1 sat. */
export function sendPasswordResetEmail(to: string, link: string) {
  return sendEmail({
    to,
    subject: "Nova lozinka za monahome",
    html: layout(
      "Link za postavljanje nove lozinke.",
      `
        ${label("Nalog")}
        ${heading("Nova lozinka")}
        ${paragraph("Zatražena je nova lozinka za vaš monahome nalog. Kliknite na dugme i izaberite novu lozinku.")}
        ${button(link, "Postavi novu lozinku")}
        ${small("Link važi jedan sat i može se iskoristiti samo jednom. Ako niste vi tražili novu lozinku, slobodno zanemarite ovaj mejl; stara lozinka ostaje ista.")}`,
    ),
    text: `Nova lozinka za monahome\n\nPostavite novu lozinku na ovom linku (važi jedan sat):\n${link}\n\nAko niste vi tražili novu lozinku, zanemarite ovaj mejl.`,
  });
}

/** Poziv za nalog koji je napravio admin (npr. partner ili saradnik). Važi 7 dana. */
export function sendInviteEmail(to: string, link: string, roleLabel: string) {
  return sendEmail({
    to,
    subject: "Pozivnica za monahome",
    html: layout(
      "Napravljen vam je nalog na monahome.",
      `
        ${label(roleLabel)}
        ${heading("Dobrodošli.")}
        ${paragraph("Za vas je napravljen nalog na monahome. Izaberite lozinku i nalog je spreman.")}
        ${button(link, "Postavi lozinku")}
        ${small("Link važi sedam dana i može se iskoristiti samo jednom.")}`,
    ),
    text: `Dobrodošli u monahome.\n\nIzaberite lozinku za svoj nalog (link važi sedam dana):\n${link}`,
  });
}