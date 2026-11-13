import "server-only";

type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Slanje preko Resend API-ja. Bez RESEND_API_KEY i EMAIL_FROM samo zapiše u log i preskoči,
 * pa porudžbine rade i lokalno, pre podešavanja domena. Greška pri slanju nikad ne ruši porudžbinu.
 */
export async function sendEmail({ to, subject, html, text, replyTo }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[email] RESEND_API_KEY ili EMAIL_FROM nije podešen, preskačem: „${subject}“ → ${to}`);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: replyTo }),
    });
    if (!response.ok) {
      console.error(`[email] Resend ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error("[email] Slanje nije uspelo:", error);
  }
}