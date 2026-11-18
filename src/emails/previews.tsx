import type { ReactElement } from "react";

import { InviteEmail, inviteSubject } from "./invite";
import { OrderConfirmationEmail, orderConfirmationSubject } from "./order-confirmation";
import { OrderNotificationEmail, orderNotificationSubject } from "./order-notification";
import { OrderShippedEmail, orderShippedSubject } from "./order-shipped";
import { PasswordResetEmail, passwordResetSubject } from "./password-reset";
import { SAMPLE_ORDER } from "./types";

type Preview = { title: string; subject: string; render: () => ReactElement };

/** Svi mejlovi sa probnim podacima, za stranicu /dev/mailovi (samo u razvoju). */
export const EMAIL_PREVIEWS: Record<string, Preview> = {
  "potvrda-porudzbine": {
    title: "Potvrda porudžbine (kupcu)",
    subject: orderConfirmationSubject(SAMPLE_ORDER),
    render: () => <OrderConfirmationEmail {...OrderConfirmationEmail.PreviewProps} />,
  },
  "nova-porudzbina": {
    title: "Nova porudžbina (prodavnici)",
    subject: orderNotificationSubject(SAMPLE_ORDER),
    render: () => <OrderNotificationEmail {...OrderNotificationEmail.PreviewProps} />,
  },
  "porudzbina-poslata": {
    title: "Porudžbina poslata (kupcu)",
    subject: orderShippedSubject(SAMPLE_ORDER),
    render: () => <OrderShippedEmail {...OrderShippedEmail.PreviewProps} />,
  },
  "promena-lozinke": {
    title: "Promena lozinke",
    subject: passwordResetSubject,
    render: () => <PasswordResetEmail {...PasswordResetEmail.PreviewProps} />,
  },
  "aktivacija-naloga": {
    title: "Aktivacija naloga (pozivnica)",
    subject: inviteSubject,
    render: () => <InviteEmail {...InviteEmail.PreviewProps} />,
  },
};