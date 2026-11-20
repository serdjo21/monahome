"use client";

import { useActionState, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { ROOM_IMAGE_SPECS } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { saveRoom } from "@/server/admin/room-actions";

import { FocalPicker } from "./focal-picker";
import { ImageField } from "./image-field";

type SaveImage = (path: string | null) => Promise<{ ok: boolean; error?: string }>;

export type RoomFormData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isVisible: boolean;
  imageAlt: string | null;
  heroTheme: "ESPRESO" | "KAMEN";
  heroImageAlt: string | null;
  heroFocalX: number;
  heroFocalY: number;
  editorialText: string | null;
  editorialImageAlt: string | null;
  images: {
    card: string | null;
    hero: string | null;
    heroMobile: string | null;
    editorial: string | null;
  };
};

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-hairline pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h2 className="label text-ink">{title}</h2>
        {note ? <p className="max-w-2xl text-caption text-ink-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

const THEMES = [
  { value: "ESPRESO", label: "Espreso", swatch: "bg-espreso" },
  { value: "KAMEN", label: "Kamen", swatch: "bg-kamen border border-hairline" },
] as const;

/**
 * Sve o jednoj sobi na jednom mestu. Fotografije se čuvaju odmah po otpremanju;
 * tekstovi, boja i tačka fokusa dugmetom „Sačuvaj izmene“ na dnu.
 */
export function RoomForm({
  room,
  saveImage,
}: {
  room: RoomFormData;
  saveImage: { card: SaveImage; hero: SaveImage; heroMobile: SaveImage; editorial: SaveImage };
}) {
  const [state, action, pending] = useActionState(saveRoom, null);
  const [, startTransition] = useTransition();
  const [slug, setSlug] = useState(room.slug);
  const [name, setName] = useState(room.name);
  const errors = state?.fieldErrors ?? {};
  const nextSlug = slugify(slug || name);
  const slugChanged = nextSlug !== room.slug;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-10"
      noValidate
    >
      <input type="hidden" name="roomId" value={room.id} />

      <Section title="Osnovno">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="name"
            label="Naziv"
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />
          <Field
            name="slug"
            label="Link"
            maxLength={60}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            error={errors.slug}
            hint={
              slugChanged && nextSlug
                ? `Novi link: monahome.rs/${nextSlug}. Stari link /${room.slug} prestaje da radi.`
                : `monahome.rs/${nextSlug || room.slug}`
            }
          />
        </div>
        <TextAreaField
          name="description"
          label="Kratak opis (opciono)"
          rows={2}
          maxLength={160}
          defaultValue={room.description ?? ""}
          error={errors.description}
          hint="Jedna rečenica. Prikazuje se u heroju sobe, u meniju, na početnoj i u Google rezultatima."
        />
        <label className="flex cursor-pointer items-center gap-3 text-body text-ink">
          <input type="checkbox" name="isVisible" defaultChecked={room.isVisible} className="size-4 accent-espreso" />
          Vidljiva na sajtu
        </label>
      </Section>

      <Section title="Kartica na početnoj" note="Fotografija sobe u bloku „Sobe“ na početnoj stranici.">
        <div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr] md:items-start">
          <ImageField
            label="Fotografija"
            spec={ROOM_IMAGE_SPECS.card}
            folder="sobe"
            previewRatio="3/4"
            src={room.images.card}
            save={saveImage.card}
          />
          <Field
            name="imageAlt"
            label="Opis fotografije"
            maxLength={200}
            defaultValue={room.imageAlt ?? ""}
            error={errors.imageAlt}
            hint="Šta se vidi, npr. „Lanena posteljina na krevetu uz prozor“."
          />
        </div>
      </Section>

      <Section
        title="Hero"
        note="Vrh stranice sobe. Bez fotografije prikazuje se pun blok u izabranoj boji; sa fotografijom naziv stoji preko nje."
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 label text-ink-muted">Boja (kad nema fotografije)</legend>
          <div className="flex gap-6">
            {THEMES.map((theme) => (
              <label key={theme.value} className="flex cursor-pointer items-center gap-3 text-body text-ink">
                <input
                  type="radio"
                  name="heroTheme"
                  value={theme.value}
                  defaultChecked={room.heroTheme === theme.value}
                  className="size-4 accent-espreso"
                />
                <span aria-hidden="true" className={cn("size-5", theme.swatch)} />
                {theme.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ImageField
            label="Fotografija (računar)"
            spec={ROOM_IMAGE_SPECS.hero}
            folder="sobe"
            previewRatio="16/7"
            src={room.images.hero}
            save={saveImage.hero}
            focal={{ x: room.heroFocalX, y: room.heroFocalY }}
            optionalNote="Bez fotografije: blok u boji"
          />
          <ImageField
            label="Fotografija (telefon, opciono)"
            spec={ROOM_IMAGE_SPECS.heroMobile}
            folder="sobe"
            previewRatio="4/5"
            src={room.images.heroMobile}
            save={saveImage.heroMobile}
            focal={{ x: room.heroFocalX, y: room.heroFocalY }}
            optionalNote="Bez nje: seče se fotografija za računar"
          />
        </div>

        {room.images.hero ? (
          <>
            <FocalPicker
              key={room.images.hero}
              src={room.images.hero}
              mobileSrc={room.images.heroMobile}
              defaultX={room.heroFocalX}
              defaultY={room.heroFocalY}
              nameX="heroFocalX"
              nameY="heroFocalY"
            />
            <Field
              name="heroImageAlt"
              label="Opis fotografije"
              maxLength={200}
              defaultValue={room.heroImageAlt ?? ""}
              error={errors.heroImageAlt}
            />
          </>
        ) : (
          <>
            <input type="hidden" name="heroFocalX" value={room.heroFocalX} />
            <input type="hidden" name="heroFocalY" value={room.heroFocalY} />
            <input type="hidden" name="heroImageAlt" value={room.heroImageAlt ?? ""} />
          </>
        )}
      </Section>

      <Section
        title="Editorijal"
        note="Fotografija sa rečenicom koja prekida mrežu proizvoda. Prikazuje se samo kad postoji tekst."
      >
        <TextAreaField
          name="editorialText"
          label="Tekst (opciono)"
          rows={3}
          maxLength={240}
          defaultValue={room.editorialText ?? ""}
          error={errors.editorialText}
          hint="Kratko i atmosferično, jedna do dve rečenice. Ispisuje se velikim kurzivom."
        />
        <div className="grid gap-6 md:grid-cols-[minmax(0,24rem)_1fr] md:items-start">
          <ImageField
            label="Fotografija"
            spec={ROOM_IMAGE_SPECS.editorial}
            folder="sobe"
            previewRatio="3/2"
            src={room.images.editorial}
            save={saveImage.editorial}
          />
          <Field
            name="editorialImageAlt"
            label="Opis fotografije"
            maxLength={200}
            defaultValue={room.editorialImageAlt ?? ""}
            error={errors.editorialImageAlt}
          />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-5 flex flex-col gap-3 border-t border-hairline bg-surface-raised px-5 py-4 sm:flex-row sm:items-center sm:gap-6 md:-mx-6 md:px-6">
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm:w-auto")}>
          {pending ? "Čuvanje…" : "Sačuvaj izmene"}
        </button>
        {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
        {state?.fieldErrors ? <p className="text-caption text-accent">Proverite označena polja.</p> : null}
        {state?.message ? <p className="text-caption text-ink">{state.message}</p> : null}
        {!state ? (
          <p className="text-caption text-ink-muted">
            Fotografije se čuvaju odmah; ovo dugme čuva tekstove i podešavanja.
          </p>
        ) : null}
      </div>
    </form>
  );
}