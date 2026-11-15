import { InviteForm } from "@/components/admin/invite-form";
import { AdminPageHeader, Panel, tableClass, thClass } from "@/components/admin/ui";
import { UserRow } from "@/components/admin/user-row";
import { formatDateTime } from "@/lib/admin-format";
import { requireRole } from "@/server/auth/guard";
import { prisma } from "@/server/db";

export const metadata = { title: "Korisnici" };

export default async function AdminUsersPage() {
  const admin = await requireRole("ADMIN", "/admin/korisnici");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, email: true, name: true, role: true, isActive: true, passwordHash: true, lastLoginAt: true },
  });

  return (
    <>
      <AdminPageHeader
        title="Korisnici"
        description="Nalozi i uloge. Promena uloge ili isključenje odmah odjavljuje korisnika sa svih uređaja."
      />

      <Panel title="Pozovi korisnika" className="mb-8">
        <div className="py-2">
          <InviteForm />
        </div>
      </Panel>

      <Panel title="Svi nalozi">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Korisnik</th>
                <th className={thClass}>Uloga</th>
                <th className={thClass}>Poslednja prijava</th>
                <th className={thClass}>
                  <span className="sr-only">Akcije</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  isSelf={user.id === admin.id}
                  user={{
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isActive: user.isActive,
                    hasPassword: Boolean(user.passwordHash),
                    lastLogin: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : null,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}