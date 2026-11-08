import Link from "next/link";

import { Media } from "@/components/ui/media";
import type { RoomDetail } from "@/server/storefront/types";

/**
 * Hero sobe, podešava se u adminu za svaku sobu posebno.
 * Bez slike: pun blok u boji teme (podrazumevano espreso), kao prekid posle svetlog headera.
 * Sa slikom: fotografija preko cele širine, naziv preko nje na tamnom prelazu.
 */
export function RoomHero({ room }: { room: RoomDetail }) {
  return room.hero.image ? <ImageHero room={room} image={room.hero.image} /> : <ColorHero room={room} />;
}

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Putanja">
      <ol className="flex items-center gap-2 text-caption text-ink-muted">
        <li>
          <Link href="/" className="transition-colors hover:text-ink">
            Početna
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{name}</li>
      </ol>
    </nav>
  );
}

function Title({ room, descriptionClass }: { room: RoomDetail; descriptionClass: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
      <h1
        id="soba-naslov"
        className="font-display text-[3.5rem] leading-[0.9] tracking-[-0.02em] text-balance text-ink italic md:text-display-1 lg:col-span-8 xl:text-[8rem]"
      >
        {room.name}
      </h1>
      {room.description ? (
        <p className={`max-w-sm text-body-lg lg:col-span-3 lg:col-start-10 lg:pb-3 ${descriptionClass}`}>
          {room.description}
        </p>
      ) : null}
    </div>
  );
}

function ColorHero({ room }: { room: RoomDetail }) {
  return (
    <section data-theme={room.hero.theme} aria-labelledby="soba-naslov" className="bg-surface">
      <div className="container-page flex min-h-[24rem] flex-col justify-between gap-20 pt-8 pb-12 md:min-h-[30rem] md:pt-10 md:pb-16 lg:min-h-[34rem]">
        <Breadcrumb name={room.name} />
        <Title room={room} descriptionClass="text-ink-muted" />
      </div>
    </section>
  );
}

function ImageHero({ room, image }: { room: RoomDetail; image: NonNullable<RoomDetail["hero"]["image"]> }) {
  return (
    <section data-theme="espreso" aria-labelledby="soba-naslov" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <div className="h-full lg:hidden">
          <Media media={room.hero.imageMobile ?? image} sizes="100vw" preload />
        </div>
        <div className="hidden h-full lg:block">
          <Media media={image} sizes="100vw" preload />
        </div>
      </div>
      {/* Tamni prelaz: odozdo za naslov, blago odozgo za putanju. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-espreso/90 via-espreso/35 to-espreso/30"
      />

      <div className="container-page flex min-h-[min(40rem,calc(100dvh-4rem))] flex-col justify-between gap-20 pt-8 pb-12 md:pt-10 md:pb-16 lg:min-h-[min(44rem,calc(100dvh-7.25rem))]">
        <Breadcrumb name={room.name} />
        <Title room={room} descriptionClass="text-ink/85" />
      </div>
    </section>
  );
}