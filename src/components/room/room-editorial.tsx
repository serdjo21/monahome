import { Media } from "@/components/ui/media";
import type { RoomDetail } from "@/server/storefront/types";

/** Editorijal prekid u mreži: široka fotografija i jedna rečenica. Tekst i slika iz admina. */
export function RoomEditorial({ editorial }: { editorial: NonNullable<RoomDetail["editorial"]> }) {
  return (
    <figure className="grid gap-6 py-4 md:py-8 lg:grid-cols-4 lg:items-end lg:gap-x-6">
      <div className="lg:col-span-3">
        <Media media={editorial.image} ratio="3/2" sizes="(min-width: 64rem) 75vw, 100vw" />
      </div>
      <figcaption className="max-w-sm font-display text-display-3 leading-snug text-balance text-ink italic lg:pb-2">
        {editorial.text}
      </figcaption>
    </figure>
  );
}