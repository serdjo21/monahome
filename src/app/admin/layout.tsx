import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = {
  title: { template: "%s · admin", default: "Admin" },
  robots: { index: false, follow: false },
};

/**
 * Sve pod /admin traži ulogu ADMIN. Provera je i ovde i u svakoj stranici i akciji:
 * layout se ne renderuje ponovo pri prelasku između stranica, pa sam ne bi bio dovoljna zaštita.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
  return <AdminShell user={user}>{children}</AdminShell>;
}