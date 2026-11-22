import Link from "next/link";
import { notFound } from "next/navigation";

import { PageEditor } from "@/components/admin/page-editor";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { isPageSlug, PAGE_GROUP } from "@/lib/pages";
import { getAdminPage } from "@/server/admin/pages";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Stranica" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

export default async function AdminPageEditPage({ params }: PageProps<"/admin/tekstovi/[slug]">) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  await requireRole("ADMIN", `/admin/tekstovi/${slug}`);

  const page = await getAdminPage(slug);
  const placeholders = /\[[A-ZČĆŠĐŽ ]{3,}\]/.test(`${page.intro ?? ""}\n${page.body}`);

  return (
    <>
      <Link
        href="/admin/tekstovi"
        className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Sve stranice
      </Link>
      <AdminPageHeader
        title={page.title}
        description={`monahome.rs/${slug}`}
        actions={
          <Link href={`/${slug}`} target="_blank" className="text-caption text-ink underline underline-offset-4">
            Pogledaj na sajtu
          </Link>
        }
      />

      {placeholders ? (
        <p className="mb-8 max-w-4xl border border-accent px-5 py-4 text-caption text-ink">
          U tekstu još postoje oznake u uglastim zagradama (npr. [NAZIV FIRME]). Zamenite ih pravim podacima pre
          lansiranja.
          {PAGE_GROUP[slug] === "Pravno" ? " Pravni tekst pre objave treba da pregleda stručno lice." : null}
        </p>
      ) : null}

      <Panel className="max-w-4xl">
        <div className="py-2">
          <PageEditor page={page} customized={page.updatedAt !== null} />
        </div>
      </Panel>
    </>
  );
}