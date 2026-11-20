import Link from "next/link";

import { RoomCreateForm } from "@/components/admin/room-create-form";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Nova soba" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

export default async function NewRoomPage() {
  await requireRole("ADMIN", "/admin/sobe/nova");

  return (
    <>
      <Link
        href="/admin/sobe"
        className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Sve sobe
      </Link>
      <AdminPageHeader
        title="Nova soba"
        description="Soba se pravi skrivena, na kraju menija. Posle toga dodajete fotografije i hero, pa je uključujete."
      />
      <Panel className="max-w-2xl">
        <div className="py-2">
          <RoomCreateForm />
        </div>
      </Panel>
    </>
  );
}