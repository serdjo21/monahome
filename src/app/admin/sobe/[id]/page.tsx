import Link from "next/link";
import { notFound } from "next/navigation";

import { RoomDelete } from "@/components/admin/room-delete";
import { RoomForm } from "@/components/admin/room-form";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { setRoomImage } from "@/server/admin/room-actions";
import { getAdminRoom } from "@/server/admin/rooms";
import { requireRole } from "@/server/auth/guard";
import { mediaUrl } from "@/server/storefront/media";

export const metadata = { title: "Soba" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

export default async function AdminRoomPage({ params }: PageProps<"/admin/sobe/[id]">) {
  const { id } = await params;
  await requireRole("ADMIN", `/admin/sobe/${id}`);

  const room = await getAdminRoom(id);
  if (!room) notFound();

  return (
    <>
      <Link
        href="/admin/sobe"
        className="mb-6 inline-block text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Sve sobe
      </Link>
      <AdminPageHeader
        title={room.name}
        description={
          room.isVisible ? `Vidljiva na monahome.rs/${room.slug}` : "Skrivena: ne vidi se u meniju ni na sajtu."
        }
        actions={
          room.isVisible ? (
            <Link href={`/${room.slug}`} target="_blank" className="text-caption text-ink underline underline-offset-4">
              Pogledaj na sajtu
            </Link>
          ) : undefined
        }
      />

      <Panel className="max-w-5xl">
        <div className="py-2">
          <RoomForm
            room={{
              id: room.id,
              slug: room.slug,
              name: room.name,
              description: room.description,
              isVisible: room.isVisible,
              imageAlt: room.imageAlt,
              heroTheme: room.heroTheme,
              heroImageAlt: room.heroImageAlt,
              heroFocalX: room.heroFocalX,
              heroFocalY: room.heroFocalY,
              editorialText: room.editorialText,
              editorialImageAlt: room.editorialImageAlt,
              images: {
                card: mediaUrl(room.imagePath),
                hero: mediaUrl(room.heroImagePath),
                heroMobile: mediaUrl(room.heroImageMobilePath),
                editorial: mediaUrl(room.editorialImagePath),
              },
            }}
            saveImage={{
              card: setRoomImage.bind(null, room.id, "imagePath"),
              hero: setRoomImage.bind(null, room.id, "heroImagePath"),
              heroMobile: setRoomImage.bind(null, room.id, "heroImageMobilePath"),
              editorial: setRoomImage.bind(null, room.id, "editorialImagePath"),
            }}
          />
        </div>
      </Panel>

      <Panel title="Brisanje" className="mt-8 max-w-5xl">
        <div className="py-2">
          <RoomDelete roomId={room.id} productCount={room._count.products} />
        </div>
      </Panel>
    </>
  );
}