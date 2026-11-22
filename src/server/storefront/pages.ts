import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { draftPage, type PageContent, type PageSlug } from "@/lib/pages";
import { prisma } from "@/server/db";

/** Tag za tekstualne stranice; admin ga osvežava posle izmene. */
export const PAGES_TAG = "pages";

/** Stranica iz baze, a dok nije izmenjena u adminu, nacrt iz koda. */
export async function getPage(slug: PageSlug): Promise<PageContent> {
  "use cache";
  cacheLife("days");
  cacheTag(PAGES_TAG);

  const row = await prisma.page.findUnique({ where: { slug } });
  if (!row) return draftPage(slug);
  return {
    slug,
    title: row.title,
    intro: row.intro,
    body: row.body,
    seoDescription: row.seoDescription,
    updatedAt: row.updatedAt,
  };
}