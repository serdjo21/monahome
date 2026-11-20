import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader, Panel, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { moveRoom } from "@/server/admin/room-actions";
import { listRooms } from "@/server/admin/rooms";
import { requireRole } from "@/server/auth/guard";
import { mediaUrl } from "@/server/storefront/media";

export const metadata = { title: "Sobe" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

const arrow =
  "flex size-8 items-center justify-center border border-hairline text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30";

export default async function AdminRoomsPage() {
  await requireRole("ADMIN", "/admin/sobe");
  const rooms = await listRooms();

  return (
    <>
      <AdminPageHeader
        title="Sobe"
        description="Redosled ovde je redosled u meniju, futeru i na početnoj."
        actions={<LinkButton href="/admin/sobe/nova">Nova soba</LinkButton>}
      />

      <Panel>
        {rooms.length === 0 ? (
          <p className="py-10 text-center text-body text-ink-muted">Još nema soba.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>
                    <span className="sr-only">Redosled</span>
                  </th>
                  <th className={thClass}>Soba</th>
                  <th className={thClass}>Proizvodi</th>
                  <th className={thClass}>Na sajtu</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, index) => {
                  const src = mediaUrl(room.imagePath);
                  return (
                    <tr
                      key={room.id}
                      className={cn("transition-colors hover:bg-surface", !room.isVisible && "opacity-70")}
                    >
                      <td className={`${tdClass} w-24`}>
                        <div className="flex gap-1.5">
                          <form action={moveRoom}>
                            <input type="hidden" name="roomId" value={room.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button
                              type="submit"
                              disabled={index === 0}
                              aria-label={`${room.name}: pomeri gore`}
                              className={arrow}
                            >
                              ↑
                            </button>
                          </form>
                          <form action={moveRoom}>
                            <input type="hidden" name="roomId" value={room.id} />
                            <input type="hidden" name="direction" value="down" />
                            <button
                              type="submit"
                              disabled={index === rooms.length - 1}
                              aria-label={`${room.name}: pomeri dole`}
                              className={arrow}
                            >
                              ↓
                            </button>
                          </form>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <Link href={`/admin/sobe/${room.id}`} className="group flex items-center gap-4">
                          <span className="relative block h-16 w-12 shrink-0 overflow-hidden bg-surface-sunken">
                            {src ? <Image src={src} alt="" fill sizes="48px" className="object-cover" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block group-hover:underline">{room.name}</span>
                            <span className="block text-caption text-ink-muted">/{room.slug}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-ink-muted`}>
                        {room.activeCount} objavljeno
                        {room.productCount > room.activeCount ? (
                          <span className="block text-caption">{room.productCount} ukupno</span>
                        ) : null}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {room.isVisible ? (
                          <Link
                            href={`/${room.slug}`}
                            target="_blank"
                            className="text-caption text-ink underline underline-offset-4"
                          >
                            Vidljiva
                          </Link>
                        ) : (
                          <span className="text-caption text-ink-muted">Skrivena</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}