"use client";

import Image from "next/image";
import { useId, useRef, useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import { IMAGE_MAX_MB, IMAGE_TYPES, type ImageSpec, imageSpecHint, type MediaFolder } from "@/lib/media";
import { createMediaUpload } from "@/server/admin/media-actions";

type SaveResult = { ok: boolean; error?: string };

const smallButton =
  "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-40";

/** Upozorenje (ne zabrana) kad fotografija odstupa od preporuke. */
async function checkDimensions(file: File, spec: ImageSpec): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    const problems: string[] = [];
    if (width < spec.width * 0.75) problems.push("manja je od preporučenog");
    const ratio = width / height;
    const target = spec.width / spec.height;
    if (Math.abs(ratio - target) / target > 0.06) problems.push(`nije u odnosu ${spec.ratio}, pa će se iseći`);
    return problems.length > 0 ? `${width} × ${height} px: ${problems.join(" i ")}.` : null;
  } catch {
    return null;
  }
}

/**
 * Jedna fotografija za jedno mesto na sajtu (kartica sobe, hero, editorijal…).
 * Fajl ide iz browsera pravo u Supabase Storage, a `save` ga upisuje u bazu (i briše stari).
 * Čuva se odmah, nezavisno od dugmeta „Sačuvaj“ na formi oko nje.
 */
export function ImageField({
  label,
  spec,
  folder,
  src,
  previewRatio,
  save,
  focal,
  optionalNote,
}: {
  label: string;
  spec: ImageSpec;
  folder: MediaFolder;
  src: string | null;
  /** CSS odnos pregleda, npr. "3/4". */
  previewRatio: string;
  save: (path: string | null) => Promise<SaveResult>;
  focal?: { x: number; y: number };
  optionalNote?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [pending, startTransition] = useTransition();
  const working = busy || pending;

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setWarning(null);
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return setError("Dozvoljeni su samo JPG, PNG i WebP.");
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) return setError(`Fotografija može imati najviše ${IMAGE_MAX_MB} MB.`);

    setBusy(true);
    const check = await checkDimensions(file, spec);
    const signed = await createMediaUpload({ folder, type: file.type, size: file.size });
    if (!signed.ok) {
      setBusy(false);
      return setError(signed.error);
    }

    const body = new FormData();
    body.append("cacheControl", "31536000");
    body.append("", file);
    const response = await fetch(signed.uploadUrl, { method: "PUT", body }).catch(() => null);
    if (!response?.ok) {
      setBusy(false);
      return setError("Fotografija nije otpremljena. Pokušajte ponovo.");
    }

    startTransition(async () => {
      const result = await save(signed.path);
      if (!result.ok) setError(result.error ?? "Fotografija nije sačuvana.");
      else setWarning(check);
    });
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove() {
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const result = await save(null);
      if (!result.ok) setError(result.error ?? "Fotografija nije uklonjena.");
      setConfirmRemove(false);
    });
  }

  const inputId = useId();

  return (
    <div className="flex flex-col gap-3">
      <p className="label text-ink-muted">{label}</p>
      <div
        className={cn("relative max-w-md overflow-hidden bg-surface-sunken", working && "opacity-60")}
        style={{ aspectRatio: previewRatio }}
      >
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="28rem"
            className="object-cover"
            style={focal ? { objectPosition: `${focal.x}% ${focal.y}%` } : undefined}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-caption text-ink-muted">
            {optionalNote ?? "Nema fotografije"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          disabled={working}
          onChange={(event) => void upload(event.target.files?.[0])}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "cursor-pointer border border-ink px-4 py-2.5 label text-ink transition-colors hover:bg-ink hover:text-surface",
            working && "pointer-events-none opacity-50",
          )}
        >
          {working ? "Otpremanje…" : src ? "Zameni" : "Dodaj fotografiju"}
        </label>
        {src && !confirmRemove ? (
          <button type="button" disabled={working} onClick={() => setConfirmRemove(true)} className={smallButton}>
            Ukloni
          </button>
        ) : null}
        {confirmRemove ? (
          <span className="flex items-center gap-4">
            <span className="text-caption text-ink">Ukloniti?</span>
            <button type="button" disabled={working} onClick={remove} className={cn(smallButton, "text-accent")}>
              Da
            </button>
            <button type="button" onClick={() => setConfirmRemove(false)} className={smallButton}>
              Ne
            </button>
          </span>
        ) : null}
      </div>

      <p className="text-caption text-ink-muted">{imageSpecHint(spec)}</p>
      {error ? <p className="text-caption text-accent">{error}</p> : null}
      {warning ? <p className="text-caption text-ink">Otpremljeno, ali proverite: {warning}</p> : null}
    </div>
  );
}