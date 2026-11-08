import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OtherRooms } from "@/components/room/other-rooms";
import { RoomHero } from "@/components/room/room-hero";
import { RoomProducts, RoomProductsSkeleton } from "@/components/room/room-products";
import { getRoom, getRooms } from "@/server/storefront";

/** Sobe se generišu unapred pri buildu; nova soba iz admina se renderuje pri prvoj poseti. */
export async function generateStaticParams() {
  const rooms = await getRooms();
  return rooms.map((room) => ({ soba: room.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[soba]">): Promise<Metadata> {
  const { soba } = await params;
  const room = await getRoom(soba);
  if (!room) return {};

  return {
    title: room.name,
    description: room.description || undefined,
  };
}

export default async function RoomPage({ params, searchParams }: PageProps<"/[soba]">) {
  const { soba } = await params;
  const room = await getRoom(soba);
  if (!room) notFound();

  return (
    <>
      <RoomHero room={room} />
      {/* Sortiranje zavisi od URL-a, pa samo mreža čeka; hero je odmah tu. */}
      <Suspense fallback={<RoomProductsSkeleton />}>
        <RoomProducts slug={room.slug} editorial={room.editorial} searchParams={searchParams} />
      </Suspense>
      <OtherRooms current={room.slug} />
    </>
  );
}