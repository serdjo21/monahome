import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/icons";
import { getRooms } from "@/server/storefront";

/** Na dnu sobe: ostale sobe kao krupni tipografski linkovi, da obilazak doma ne staje. */
export async function OtherRooms({ current }: { current: string }) {
  const rooms = (await getRooms()).filter((room) => room.slug !== current);
  if (rooms.length === 0) return null;

  return (
    <nav aria-labelledby="ostale-sobe" className="border-t border-hairline bg-surface-raised py-16 md:py-section">
      <div className="container-page">
        <h2 id="ostale-sobe" className="eyebrow text-ink-muted">
          Nastavite kroz dom
        </h2>
        <ul className="mt-8 border-b border-hairline md:mt-12">
          {rooms.map((room) => (
            <li key={room.slug} className="border-t border-hairline">
              <Link
                href={`/${room.slug}`}
                className="group grid grid-cols-[1fr_auto] items-center gap-6 py-6 md:grid-cols-[1fr_1fr_auto] md:py-8"
              >
                <span className="font-display text-display-3 text-ink transition-transform duration-500 ease-editorial group-hover:translate-x-2 md:text-display-2">
                  {room.name}
                </span>
                <span className="hidden text-body text-ink-muted md:block">{room.description}</span>
                <ArrowRightIcon
                  aria-hidden="true"
                  className="text-ink transition-transform duration-500 ease-editorial group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}