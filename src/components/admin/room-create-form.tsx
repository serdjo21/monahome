"use client";

import { useActionState, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { slugify } from "@/lib/slug";
import { createRoom } from "@/server/admin/room-actions";

export function RoomCreateForm() {
  const [state, action, pending] = useActionState(createRoom, null);
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
        maxLength={60}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="npr. Trpezarija"
        error={errors.name}
      />
      <Field
        name="slug"
        label="Link (opciono)"
        maxLength={60}
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder={slugify(name) || "pravi-se-iz-naziva"}
        hint={preview ? `monahome.rs/${preview}` : "Pravi se sam iz naziva."}
        error={errors.slug}
      />
      <TextAreaField
        name="description"
        label="Kratak opis (opciono)"
        rows={2}
        maxLength={160}
        error={errors.description}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm:w-auto")}>
          {pending ? "Čuvanje…" : "Napravi sobu"}
        </button>
        {state?.error ? <p className="text-caption text-accent">{state.error}</p> : null}
      </div>
    </form>
  );
}