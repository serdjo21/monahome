import Link from "next/link";

import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin-format";
import { PAGE_GROUP } from "@/lib/pages";
import { listPages } from "@/server/admin/pages";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Tekstovi i stranice" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

const GROUPS = ["Brend", "Pomoć", "Pravno"] as const;

export default async function AdminPagesPage() {
  await requireRole("ADMIN", "/admin/tekstovi");
  const pages = await listPages();

  return (
    <>
      <AdminPageHeader
        title="Tekstovi i stranice"
        description="Stranice iz futera. Dok stranicu ne sačuvate, na sajtu stoji početni tekst."
      />

      <div className="flex max-w-4xl flex-col gap-8">
        {GROUPS.map((group) => (
          <Panel key={group} title={group}>
            <ul>
              {pages
                .filter((page) => PAGE_GROUP[page.slug] === group)
                .map((page) => (
                  <li
                    key={page.slug}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-hairline py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <Link href={`/admin/tekstovi/${page.slug}`} className="text-body text-ink hover:underline">
                        {page.title}
                      </Link>
                      <p className="text-caption text-ink-muted">/{page.slug}</p>
                    </div>
                    <p className="text-caption text-ink-muted">
                      {page.updatedAt ? `Izmenjeno ${formatDateTime(page.updatedAt)}` : "Početni tekst"}
                    </p>
                  </li>
                ))}
            </ul>
          </Panel>
        ))}

        <p className="text-caption text-ink-muted">
          Pravne stranice su nacrt: pre lansiranja ih treba da pregleda knjigovođa ili advokat, i da se umesto oznaka u
          uglastim zagradama ([NAZIV FIRME], [PIB]…) upišu podaci firme.
        </p>
      </div>
    </>
  );
}
