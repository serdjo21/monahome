import Link from "next/link";

import { CampaignCreateForm } from "@/components/admin/campaign-create-form";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Nova kampanja" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

export default async function NewCampaignPage() {
  await requireRole("ADMIN", "/admin/kampanje/nova");

  return (
    <>
      <Link
        href="/admin/kampanje"
        className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Sve kampanje
      </Link>
      <AdminPageHeader
        title="Nova kampanja"
        description="Pravi se kao nacrt. Posle toga uređujete hero, proizvode i editorijal, pregledate je i zakazujete."
      />
      <Panel className="max-w-2xl">
        <div className="py-2">
          <CampaignCreateForm />
        </div>
      </Panel>
    </>
  );
}