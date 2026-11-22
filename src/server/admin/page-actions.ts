"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/lib/auth-forms";
import { isPageSlug } from "@/lib/pages";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { PAGES_TAG } from "@/server/storefront/pages";

function refresh(slug: string) {
  revalidateTag(PAGES_TAG, "max");
  revalidatePath("/admin/tekstovi", "layout");
  revalidatePath(`/${slug}`);
}

const optional = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} može imati najviše ${max} znakova.` })
    .transform((value) => value || null);

const pageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { error: "Unesite naslov." })
    .max(80, { error: "Naslov može imati najviše 80 znakova." }),
  intro: optional(300, "Uvod"),
  body: z
    .string()
    .trim()
    .min(1, { error: "Tekst stranice ne može biti prazan." })
    .max(30_000, { error: "Tekst je predugačak." }),
  seoDescription: optional(160, "Opis za Google"),
});

/** Čuva tekst stranice (prvo čuvanje pravi red u bazi; do tada važi nacrt iz koda). */
export async function savePage(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/admin/tekstovi");

  const slug = String(formData.get("slug") ?? "");
  if (!isPageSlug(slug)) return { error: "Neispravan zahtev." };

  const values = {
    title: String(formData.get("title") ?? ""),
    intro: String(formData.get("intro") ?? ""),
    body: String(formData.get("body") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
  };
  const parsed = pageSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values };
  }

  await prisma.page.upsert({ where: { slug }, create: { slug, ...parsed.data }, update: parsed.data });
  refresh(slug);
  return { message: "Stranica je sačuvana i vidi se na sajtu." };
}

/** Vraća nacrt iz koda (briše izmenjenu verziju). */
export async function resetPage(slug: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN", "/admin/tekstovi");
  if (!isPageSlug(slug)) return { ok: false, error: "Neispravan zahtev." };

  await prisma.page.deleteMany({ where: { slug } });
  refresh(slug);
  return { ok: true };
}
