"use client";

import { useActionState, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { slugify } from "@/lib/slug";
import { createCampaign } from "@/server/admin/campaign-actions";

export function CampaignCreateForm() {
  const [state, action, pending] = useActionState(createCampaign, null);
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const errors = state?.fieldErrors ?? {};
  const preview = slugify(slug || name);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      <Field
        name="name"
        label="Naziv"
        required
        maxLength={80}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="npr. Zima 2026"
        error={errors.name}
      />
      <Field
        name="slug"
        label="Link (opciono)"
        maxLength={80}
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder={slugify(name) || "pravi-se-iz-naziva"}
        hint={preview ? `monahome.rs/kolekcija/${preview}` : "Pravi se sam iz naziva."}
        error={errors.slug}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm:w-auto")}>
          {pending ? "Čuvanje…" : "Napravi kampanju"}
        </button>
        {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
      </div>
    </form>
  );
}