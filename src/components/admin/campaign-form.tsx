"use client";

import { useActionState, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import type { CampaignStatus, HeroLayout } from "@/generated/prisma/enums";
import { CAMPAIGN_STATUS_LABEL, HERO_LAYOUTS } from "@/lib/campaign-admin";
import { cn } from "@/lib/cn";
import { CAMPAIGN_IMAGE_SPECS } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { saveCampaign } from "@/server/admin/campaign-actions";

import { FocalPicker } from "./focal-picker";
import { ImageField } from "./image-field";

type SaveImage = (path: string | null) => Promise<{ ok: boolean; error?: string }>;

export type CampaignFormData = {
  id: string;
  slug: string;
  name: string;
  status: CampaignStatus;
  isDefault: boolean;
  startsAt: string;
  endsAt: string;
  season: string;
  headline: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
  layout: HeroLayout;
  theme: "ESPRESO" | "KAMEN";
  heroImageAlt: string | null;
  focalX: number;
  focalY: number;
  editorialTitle: string | null;
  editorialText: string | null;
  editorialImageAlt: string | null;
  images: { hero: string | null; heroMobile: string | null; editorial: string | null };
};

const selectClass =
  "h-13 w-full border border-hairline bg-transparent px-3 text-[16px] text-ink outline-none transition-colors hover:border-ink-muted focus:border-ink md:text-body";

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
 * Tekstovi, period i izgled kampanje. Fotografije se čuvaju odmah po otpremanju,
 * sve ostalo dugmetom „Sačuvaj izmene“ na dnu.
 */
export function CampaignForm({
  campaign,
  saveImage,
}: {
  campaign: CampaignFormData;
  saveImage: { hero: SaveImage; heroMobile: SaveImage; editorial: SaveImage };
}) {
  const [state, action, pending] = useActionState(saveCampaign, null);
  const [, startTransition] = useTransition();
  const [name, setName] = useState(campaign.name);
  const [slug, setSlug] = useState(campaign.slug);
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const errors = state?.fieldErrors ?? {};
  const nextSlug = slugify(slug || name);

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
      <input type="hidden" name="campaignId" value={campaign.id} />

      <Section title="Osnovno">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="name"
            label="Interni naziv"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            hint="Vidi se samo u adminu."
            error={errors.name}
          />
          <Field
            name="slug"
            label="Link kolekcije"
            maxLength={80}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            hint={`monahome.rs/kolekcija/${nextSlug || campaign.slug}`}
            error={errors.slug}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="kampanja-status" className="label text-ink-muted">
              Status
            </label>
            <select
              id="kampanja-status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as CampaignStatus)}
              className={selectClass}
            >
              {(Object.keys(CAMPAIGN_STATUS_LABEL) as CampaignStatus[]).map((value) => (
                <option key={value} value={value}>
                  {CAMPAIGN_STATUS_LABEL[value]}
                </option>
              ))}
            </select>
            {errors.status ? <p className="text-caption text-accent">{errors.status}</p> : null}
          </div>
          <Field
            name="startsAt"
            label={status === "SCHEDULED" ? "Početak" : "Početak (opciono)"}
            type="date"
            defaultValue={campaign.startsAt}
            error={errors.startsAt}
          />
          <Field
            name="endsAt"
            label={status === "SCHEDULED" ? "Kraj (uključujući taj dan)" : "Kraj (opciono)"}
            type="date"
            defaultValue={campaign.endsAt}
            error={errors.endsAt}
          />
        </div>
        <p className="max-w-2xl text-caption text-ink-muted">
          Zakazana kampanja se sama pojavljuje na početnoj od početka do kraja perioda (po beogradskom vremenu). Kad
          nijedna zakazana ne traje, prikazuje se rezervna.
        </p>

        <label className="flex cursor-pointer items-start gap-3 text-body text-ink">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={campaign.isDefault}
            disabled={campaign.isDefault}
            className="mt-1 size-4 accent-espreso"
          />
          {campaign.isDefault ? <input type="hidden" name="isDefault" value="on" /> : null}
          <span>
            Rezervna kampanja
            <span className="block text-caption text-ink-muted">
              {campaign.isDefault
                ? "Ovo je rezervna kampanja. Da prestane, označite drugu kao rezervnu."
                : "Prikazuje se kad nijedna zakazana ne traje. Može biti samo jedna; prethodna prestaje da bude rezervna."}
            </span>
          </span>
        </label>
      </Section>

      <Section title="Hero" note="Prvi ekran početne i vrh stranice kolekcije.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="season"
            label="Sezona"
            required
            maxLength={40}
            defaultValue={campaign.season}
            placeholder="npr. Zima 2026"
            error={errors.season}
          />
          <Field
            name="headline"
            label="Naslov"
            required
            maxLength={90}
            defaultValue={campaign.headline}
            error={errors.headline}
          />
        </div>
        <TextAreaField
          name="intro"
          label="Uvod"
          rows={3}
          maxLength={240}
          defaultValue={campaign.intro}
          error={errors.intro}
          hint="Jedna do dve rečenice ispod naslova."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="ctaLabel"
            label="Tekst dugmeta"
            required
            maxLength={40}
            defaultValue={campaign.ctaLabel}
            error={errors.ctaLabel}
          />
          <Field
            name="ctaHref"
            label="Link dugmeta"
            required
            maxLength={300}
            defaultValue={campaign.ctaHref}
            hint={`Obično /kolekcija/${nextSlug || campaign.slug}`}
            error={errors.ctaHref}
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 label text-ink-muted">Raspored</legend>
          <div className="grid gap-3 md:grid-cols-3">
            {HERO_LAYOUTS.map((layout) => (
              <label
                key={layout.value}
                className="flex cursor-pointer items-start gap-3 border border-hairline p-4 has-checked:border-ink"
              >
                <input
                  type="radio"
                  name="layout"
                  value={layout.value}
                  defaultChecked={campaign.layout === layout.value}
                  className="mt-1 size-4 accent-espreso"
                />
                <span>
                  <span className="block text-body text-ink">{layout.label}</span>
                  <span className="block text-caption text-ink-muted">{layout.note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 label text-ink-muted">Boja</legend>
          <div className="flex gap-6">
            {THEMES.map((theme) => (
              <label key={theme.value} className="flex cursor-pointer items-center gap-3 text-body text-ink">
                <input
                  type="radio"
                  name="theme"
                  value={theme.value}
                  defaultChecked={campaign.theme === theme.value}
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
            spec={CAMPAIGN_IMAGE_SPECS.hero}
            folder="kampanje"
            previewRatio="16/9"
            src={campaign.images.hero}
            save={saveImage.hero}
            focal={{ x: campaign.focalX, y: campaign.focalY }}
          />
          <ImageField
            label="Fotografija (telefon, opciono)"
            spec={CAMPAIGN_IMAGE_SPECS.heroMobile}
            folder="kampanje"
            previewRatio="4/5"
            src={campaign.images.heroMobile}
            save={saveImage.heroMobile}
            focal={{ x: campaign.focalX, y: campaign.focalY }}
            optionalNote="Bez nje: seče se fotografija za računar"
          />
        </div>

        {campaign.images.hero ? (
          <>
            <FocalPicker
              key={campaign.images.hero}
              src={campaign.images.hero}
              mobileSrc={campaign.images.heroMobile}
              defaultX={campaign.focalX}
              defaultY={campaign.focalY}
              nameX="focalX"
              nameY="focalY"
            />
            <Field
              name="heroImageAlt"
              label="Opis fotografije"
              maxLength={200}
              defaultValue={campaign.heroImageAlt ?? ""}
              error={errors.heroImageAlt}
            />
          </>
        ) : (
          <>
            <input type="hidden" name="focalX" value={campaign.focalX} />
            <input type="hidden" name="focalY" value={campaign.focalY} />
            <input type="hidden" name="heroImageAlt" value={campaign.heroImageAlt ?? ""} />
          </>
        )}
      </Section>

      <Section
        title="Editorijal"
        note="Velika fotografija sa naslovom i tekstom na početnoj i na stranici kolekcije. Prikazuje se kad postoje i naslov i tekst."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="editorialTitle"
            label="Naslov"
            maxLength={90}
            defaultValue={campaign.editorialTitle ?? ""}
            error={errors.editorialTitle}
          />
          <Field
            name="editorialImageAlt"
            label="Opis fotografije"
            maxLength={200}
            defaultValue={campaign.editorialImageAlt ?? ""}
            error={errors.editorialImageAlt}
          />
        </div>
        <TextAreaField
          name="editorialText"
          label="Tekst"
          rows={4}
          maxLength={500}
          defaultValue={campaign.editorialText ?? ""}
          error={errors.editorialText}
        />
        <ImageField
          label="Fotografija"
          spec={CAMPAIGN_IMAGE_SPECS.editorial}
          folder="kampanje"
          previewRatio="16/7"
          src={campaign.images.editorial}
          save={saveImage.editorial}
          optionalNote="Na telefonu se seče uspravno: predmet u sredini kadra"
        />
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
            Fotografije i proizvodi se čuvaju odmah; ovo dugme čuva tekstove i podešavanja.
          </p>
        ) : null}
      </div>
    </form>
  );
}