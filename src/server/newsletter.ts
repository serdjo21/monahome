"use server";

import { z } from "zod";

import { prisma } from "@/server/db";

export type NewsletterState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; email: string };

const schema = z.object({
  email: z.email({ error: "Unesite ispravnu e-mail adresu." }).max(254),
});

export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Skriveno polje koje ljudi ne vide; ako je popunjeno, poslao ga je bot.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: "Hvala. Javićemo vam se kad stigne nova kolekcija." };
  }

  const raw = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const parsed = schema.safeParse({ email: raw });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Unesite ispravnu e-mail adresu.",
      email: raw,
    };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email, source: "pocetna" },
      update: {},
    });
  } catch (error) {
    console.error("Newsletter: upis nije uspeo", error);
    return { status: "error", message: "Trenutno ne možemo da sačuvamo prijavu. Pokušajte ponovo.", email: raw };
  }

  return { status: "success", message: "Hvala. Javićemo vam se kad stigne nova kolekcija." };
}