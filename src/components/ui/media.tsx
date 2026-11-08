import Image from "next/image";

import { cn } from "@/lib/cn";
import type { Media as MediaData } from "@/server/storefront/types";

type MediaProps = {
  media: MediaData;
  /** Odnos strana, npr. "4/5", "3/2". Izostaviti kada roditelj određuje visinu (fill). */
  ratio?: string;
  sizes: string;
  preload?: boolean;
  className?: string;
};

/**
 * Fotografija sa tačkom fokusa. Dok prava fotografija ne postoji, prikazuje tonsku površinu
 * sa opisom kadra: dizajn ostaje čitljiv, a opis služi kao brief za fotografisanje.
 */
export function Media({ media, ratio, sizes, preload = false, className }: MediaProps) {
  const objectPosition = media.focal ? `${media.focal.x}% ${media.focal.y}%` : undefined;

  return (
    <div
      className={cn("relative overflow-hidden bg-surface-sunken", !ratio && "h-full w-full", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {media.src ? (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
          style={objectPosition ? { objectPosition } : undefined}
        />
      ) : (
        <div role="img" aria-label={media.alt} className="absolute inset-0 flex items-end p-4 md:p-5">
          <span className="max-w-[28ch] text-caption text-ink-muted">{media.alt}</span>
        </div>
      )}
    </div>
  );
}