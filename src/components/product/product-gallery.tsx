"use client";

import { useRef, useState } from "react";

import { Media } from "@/components/ui/media";
import { cn } from "@/lib/cn";
import type { Media as MediaData } from "@/server/storefront/types";

/**
 * Galerija proizvoda. Telefon: prevlačenje prstom uz tanku liniju napretka.
 * Desktop: prva fotografija preko cele kolone, ostale u dve kolone, kao editorijal.
 */
export function ProductGallery({ images, productName }: { images: MediaData[]; productName: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const items: MediaData[] = images.length > 0 ? images : [{ src: null, alt: productName }];

  const handleScroll = () => {
    const track = trackRef.current;
    if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  // Ako posle prve ostane neparan broj, poslednja ide preko cele širine da mreža ne ostane krnja.
  const isWide = (i: number) => i === 0 || (i === items.length - 1 && (items.length - 1) % 2 === 1);

  return (
    <div>
      <div className="lg:hidden">
        <ul
          ref={trackRef}
          onScroll={handleScroll}
          aria-label="Fotografije proizvoda"
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {items.map((media, i) => (
            <li key={`${media.src ?? media.alt}-${i}`} className="w-full shrink-0 snap-center">
              <Media media={media} ratio="4/5" sizes="100vw" preload={i === 0} />
            </li>
          ))}
        </ul>
        {items.length > 1 ? (
          <>
            <div aria-hidden="true" className="mx-5 mt-4 h-px bg-hairline md:mx-10">
              <div
                className="h-px bg-ink transition-transform duration-300 ease-editorial"
                style={{ width: `${100 / items.length}%`, transform: `translateX(${index * 100}%)` }}
              />
            </div>
            <p className="sr-only" aria-live="polite">
              Fotografija {index + 1} od {items.length}
            </p>
          </>
        ) : null}
      </div>

      <ul className="hidden gap-2 lg:grid lg:grid-cols-2">
        {items.map((media, i) => (
          <li key={`${media.src ?? media.alt}-${i}`} className={cn(isWide(i) && "col-span-2")}>
            <Media media={media} ratio="4/5" sizes={isWide(i) ? "58vw" : "29vw"} preload={i === 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}