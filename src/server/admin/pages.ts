import "server-only";

import { draftPage, PAGE_SLUGS, type PageContent, type PageSlug } from "@/lib/pages";
import { prisma } from "@/server/db";

/** Sve stranice redom, sa datumom izmene (null = još je nacrt iz koda). */
export async function listPages() {
  const rows = await prisma.page.findMany({ select: { slug: true, title: true, updatedAt: true } });
  return PAGE_SLUGS.map((slug) => {
    const row = rows.find((item) => item.slug === slug);
    return { slug, title: row?.title ?? draftPage(slug).title, updatedAt: row?.updatedAt ?? null };
  });
}

/** Stranica za uređivanje: izmenjena verzija iz baze ili nacrt. */
export async function getAdminPage(slug: PageSlug): Promise<PageContent> {
  const row = await prisma.page.findUnique({ where: { slug } });
  return row
    ? {
        slug,
        title: row.title,
        intro: row.intro,
        body: row.body,
        seoDescription: row.seoDescription,
        updatedAt: row.updatedAt,
      }
    : draftPage(slug);
}