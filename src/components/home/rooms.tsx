import Link from "next/link";

import { Media } from "@/components/ui/media";
import { cn } from "@/lib/cn";
import { getRooms } from "@/server/storefront";

import { SectionHeading } from "./section-heading";

/** Sobe: četiri ulaza u prodavnicu, raspoređena stepenasto kao u časopisu. */
export async function Rooms() {
  const rooms = await getRooms();
  if (rooms.length === 0) return null;

  return (
    <section
      id="sobe"
      data-theme="espreso"
      aria-labelledby="sobe-naslov"
      className="scroll-mt-20 py-16 md:py-section xl:scroll-mt-32"
    >      <div className="container-page">
        <SectionHeading id="sobe-naslov" eyebrow="Po sobama" title="Za svaki kutak doma" />

        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {rooms.map((room, index) => (
            <li key={room.slug} className={cn(index % 2 === 1 && "lg:mt-24")}>
              <Link href={`/${room.slug}`} className="group block">
                <div className="overflow-hidden">
                  <div className="transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.03]">
                    <Media media={room.image} ratio="3/4" sizes="(min-width: 64rem) 25vw, 50vw" />
                  </div>
                </div>
               <h3 className="mt-5 font-display text-[1.375rem] leading-tight text-ink md:text-display-3">
                  {room.name}
                </h3>
                <p className="mt-1.5 text-caption text-ink-muted">{room.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}