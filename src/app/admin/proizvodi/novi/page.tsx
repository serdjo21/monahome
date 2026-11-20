import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { getRoomOptions } from "@/server/admin/products";
import { requireRole } from "@/server/auth/guard";

export const metadata = { title: "Novi proizvod" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

export default async function NewProductPage() {
  await requireRole("ADMIN", "/admin/proizvodi/novi");
  const rooms = await getRoomOptions();

  return (
    <>
      <Link
        href="/admin/proizvodi"
        className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Svi proizvodi
      </Link>
      <AdminPageHeader
        title="Novi proizvod"
        description="Proizvod se pravi kao nacrt i ne vidi se na sajtu. Posle toga dodajete varijante i fotografije, pa ga objavljujete."
      />
      <Panel className="max-w-3xl">
        <div className="py-2">
          <ProductForm rooms={rooms} />
        </div>
      </Panel>
    </>
  );
}