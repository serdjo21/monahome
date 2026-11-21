"use client";

import { useActionState, useTransition } from "react";

import { Field, TextAreaField } from "@/components/ui/field";
import type {
  BrandStorySettings,
  GiftsSettings,
  NewsletterSettings,
  ProductGridSettings,
  SocialSettings,
} from "@/lib/home-content";
import { HOME_IMAGE_SPECS } from "@/lib/home-content";
import { saveHomeSection } from "@/server/admin/home-actions";

import { ImageField } from "./image-field";

type SaveImage = (path: string | null) => Promise<{ ok: boolean; error?: string }>;

const saveButton =
  "self-start border border-ink px-5 py-3 label text-ink transition-colors hover:bg-ink hover:text-surface disabled:opacity-50";

/** Zajednički okvir: forma jedne sekcije, bez pražnjenja polja posle slanja. */
function SectionForm({
  type,
  children,
  note = "Prazno polje vraća podrazumevani tekst.",
}: {
  type: string;
  children: (errors: Record<string, string>) => React.ReactNode;
  note?: string;
}) {
  const [state, action, pending] = useActionState(saveHomeSection, null);
  const [, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <input type="hidden" name="type" value={type} />
      {children(state?.fieldErrors ?? {})}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-5">
        <button type="submit" disabled={pending} className={saveButton}>
          {pending ? "Čuvanje…" : "Sačuvaj"}
        </button>
        {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
        {state?.fieldErrors ? <p className="text-caption text-accent">Proverite označena polja.</p> : null}
        {state?.message ? <p className="text-caption text-ink">{state.message}</p> : null}
        {!state ? <p className="text-caption text-ink-muted">{note}</p> : null}
      </div>
    </form>
  );
}

export function ProductGridForm({ settings }: { settings: ProductGridSettings }) {
  return (
    <SectionForm type="PRODUCT_GRID">
      {(errors) => (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 label text-ink-muted">Koji proizvodi</legend>
            <label className="flex cursor-pointer items-start gap-3 text-body text-ink">
              <input
                type="radio"
                name="source"
                value="new"
                defaultChecked={settings.source === "new"}
                className="mt-1 size-4 accent-espreso"
              />
              <span>
                Novo
                <span className="block text-caption text-ink-muted">Proizvodi sa oznakom „Novo“, pa najnoviji.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-body text-ink">
              <input
                type="radio"
                name="source"
                value="bestsellers"
                defaultChecked={settings.source === "bestsellers"}
                className="mt-1 size-4 accent-espreso"
              />
              <span>
                Najprodavanije
                <span className="block text-caption text-ink-muted">
                  Dok ne krenu prave porudžbine, prikazuju se najnoviji.
                </span>
              </span>
            </label>
          </fieldset>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              name="eyebrow"
              label="Nadnaslov"
              maxLength={40}
              defaultValue={settings.eyebrow}
              error={errors.eyebrow}
            />
            <Field name="title" label="Naslov" maxLength={80} defaultValue={settings.title} error={errors.title} />
            <Field
              name="linkLabel"
              label="Tekst linka (opciono)"
              maxLength={40}
              defaultValue={settings.linkLabel}
              placeholder="npr. Pogledaj sve"
              error={errors.linkLabel}
            />
            <Field
              name="linkHref"
              label="Link (opciono)"
              maxLength={300}
              defaultValue={settings.linkHref}
              placeholder="npr. /spavaca-soba"
              hint="Bez teksta i linka, desno od naslova nema ničega."
              error={errors.linkHref}
            />
          </div>
        </>
      )}
    </SectionForm>
  );
}

export function BrandStoryForm({
  settings,
  saveImage,
  imageSrc,
}: {
  settings: BrandStorySettings;
  saveImage: SaveImage;
  imageSrc: string | null;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_1fr] lg:items-start">
      <ImageField
        label="Fotografija"
        spec={HOME_IMAGE_SPECS.brandStory}
        folder="pocetna"
        previewRatio="4/5"
        src={imageSrc}
        save={saveImage}
      />
      <SectionForm type="BRAND_STORY">
        {(errors) => (
          <>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Field
                name="eyebrow"
                label="Nadnaslov"
                maxLength={40}
                defaultValue={settings.eyebrow}
                error={errors.eyebrow}
              />
              <Field name="title" label="Naslov" maxLength={120} defaultValue={settings.title} error={errors.title} />
            </div>
            {settings.principles.map((principle, index) => (
              <fieldset
                key={index}
                className="grid gap-4 border-t border-hairline pt-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
              >
                <legend className="sr-only">Načelo {index + 1}</legend>
                <Field
                  name={`principle${index}Title`}
                  label={`Načelo ${index + 1}: naslov`}
                  maxLength={40}
                  defaultValue={principle.title}
                  error={errors[`principle${index}Title`]}
                />
                <TextAreaField
                  name={`principle${index}Text`}
                  label="Tekst"
                  rows={2}
                  maxLength={200}
                  defaultValue={principle.text}
                  error={errors[`principle${index}Text`]}
                />
              </fieldset>
            ))}
            <div className="grid gap-5 border-t border-hairline pt-5 md:grid-cols-2">
              <Field
                name="linkLabel"
                label="Tekst linka"
                maxLength={40}
                defaultValue={settings.linkLabel}
                error={errors.linkLabel}
              />
              <Field
                name="linkHref"
                label="Link"
                maxLength={300}
                defaultValue={settings.linkHref}
                error={errors.linkHref}
              />
            </div>
            <Field
              name="imageAlt"
              label="Opis fotografije"
              maxLength={200}
              defaultValue={settings.imageAlt}
              error={errors.imageAlt}
            />
          </>
        )}
      </SectionForm>
    </div>
  );
}

export function GiftsForm({
  settings,
  saveImage,
  imageSrc,
}: {
  settings: GiftsSettings;
  saveImage: SaveImage;
  imageSrc: string | null;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-start">
      <ImageField
        label="Fotografija"
        spec={HOME_IMAGE_SPECS.gifts}
        folder="pocetna"
        previewRatio="1/1"
        src={imageSrc}
        save={saveImage}
      />
      <SectionForm type="GIFTS">
        {(errors) => (
          <>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Field
                name="eyebrow"
                label="Nadnaslov"
                maxLength={40}
                defaultValue={settings.eyebrow}
                error={errors.eyebrow}
              />
              <Field name="title" label="Naslov" maxLength={80} defaultValue={settings.title} error={errors.title} />
            </div>
            <TextAreaField
              name="text"
              label="Tekst"
              rows={3}
              maxLength={400}
              defaultValue={settings.text}
              error={errors.text}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                name="ctaLabel"
                label="Tekst dugmeta"
                maxLength={40}
                defaultValue={settings.ctaLabel}
                error={errors.ctaLabel}
              />
              <Field
                name="ctaHref"
                label="Link dugmeta"
                maxLength={300}
                defaultValue={settings.ctaHref}
                hint="npr. /kolekcija/zima-2026 ili /proizvod/…"
                error={errors.ctaHref}
              />
            </div>
            <Field
              name="imageAlt"
              label="Opis fotografije"
              maxLength={200}
              defaultValue={settings.imageAlt}
              error={errors.imageAlt}
            />
          </>
        )}
      </SectionForm>
    </div>
  );
}

export function SocialForm({
  settings,
  saveImages,
  imageSrcs,
}: {
  settings: SocialSettings;
  saveImages: SaveImage[];
  imageSrcs: (string | null)[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
        {settings.posts.map((_, index) => (
          <li key={index}>
            <ImageField
              label={`Objava ${index + 1}`}
              spec={HOME_IMAGE_SPECS.social}
              folder="pocetna"
              previewRatio="1/1"
              src={imageSrcs[index]}
              save={saveImages[index]}
            />
          </li>
        ))}
      </ul>
      <SectionForm
        type="SOCIAL"
        note="Dok nijedna objava nema fotografiju, prikazuju se probni kadrovi. Prazna objava se preskače."
      >
        {(errors) => (
          <>
            <Field
              name="handle"
              label="Naslov (korisničko ime)"
              maxLength={40}
              defaultValue={settings.handle}
              error={errors.handle}
            />
            {settings.posts.map((post, index) => (
              <div key={index} className="grid gap-4 border-t border-hairline pt-5 md:grid-cols-2">
                <Field
                  name={`post${index}Href`}
                  label={`Objava ${index + 1}: link`}
                  maxLength={300}
                  defaultValue={post.href}
                  placeholder="https://www.instagram.com/p/…"
                  error={errors[`post${index}Href`]}
                />
                <Field
                  name={`post${index}Alt`}
                  label="Opis fotografije"
                  maxLength={200}
                  defaultValue={post.imageAlt}
                  error={errors[`post${index}Alt`]}
                />
              </div>
            ))}
          </>
        )}
      </SectionForm>
    </div>
  );
}

export function NewsletterForm({ settings }: { settings: NewsletterSettings }) {
  return (
    <SectionForm type="NEWSLETTER">
      {(errors) => (
        <>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Field
              name="eyebrow"
              label="Nadnaslov"
              maxLength={40}
              defaultValue={settings.eyebrow}
              error={errors.eyebrow}
            />
            <Field name="title" label="Naslov" maxLength={120} defaultValue={settings.title} error={errors.title} />
          </div>
          <Field
            name="note"
            label="Napomena ispod polja"
            maxLength={160}
            defaultValue={settings.note}
            error={errors.note}
          />
        </>
      )}
    </SectionForm>
  );
}