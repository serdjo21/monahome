"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import { MAX_PRODUCT_IMAGES, PRODUCT_IMAGE_HINT, PRODUCT_IMAGE_SPEC, PRODUCT_IMAGE_TYPES } from "@/lib/product-admin";
import {
  attachProductImages,
  createImageUploads,
  deleteProductImage,
  moveProductImage,
  updateProductImage,
} from "@/server/admin/product-image-actions";

export type ProductImageData = {
  id: string;
  src: string | null;
  alt: string;
  variantId: string | null;
};

export type ColorOption = { variantId: string; name: string; hex: string | null };

const smallButton =
  "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-40";
const input =
  "h-10 w-full border border-hairline bg-transparent px-3 text-[16px] text-ink outline-none transition-colors hover:border-ink-muted focus:border-ink md:text-caption";

/** Upozorenje (ne zabrana) kad fotografija odstupa od preporuke: premala ili nije uspravna 4:5. */
async function checkDimensions(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    const ratio = width / height;
    const target = PRODUCT_IMAGE_SPEC.width / PRODUCT_IMAGE_SPEC.height;
    const problems: string[] = [];
    if (width < 1200) problems.push("manja je od preporučenog");
    if (Math.abs(ratio - target) > 0.04) problems.push("nije u odnosu 4:5, pa će se ivice iseći");
    return problems.length > 0 ? `${file.name} (${width} × ${height} px): ${problems.join(" i ")}.` : null;
  } catch {
    return null;
  }
}

function Uploader({ productId, current }: { productId: string; current: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const left = MAX_PRODUCT_IMAGES - current;

  async function upload(list: FileList | File[]) {
    const files = Array.from(list);
    setError(null);
    setWarnings([]);
    if (files.length === 0) return;

    const wrongType = files.find((file) => !(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type));
    if (wrongType) return setError(`${wrongType.name}: dozvoljeni su samo JPG, PNG i WebP.`);
    const tooBig = files.find((file) => file.size > PRODUCT_IMAGE_SPEC.maxMb * 1024 * 1024);
    if (tooBig) return setError(`${tooBig.name}: fotografija može imati najviše ${PRODUCT_IMAGE_SPEC.maxMb} MB.`);
    if (files.length > left) return setError(`Možete dodati još ${left} fotografija.`);

    setBusy(true);
    setProgress(`Priprema ${files.length === 1 ? "fotografije" : "fotografija"}…`);
    const found = (await Promise.all(files.map(checkDimensions))).filter((w): w is string => w !== null);

    const signed = await createImageUploads(
      productId,
      files.map((file) => ({ type: file.type, size: file.size })),
    );
    if (!signed.ok) {
      setBusy(false);
      setProgress(null);
      return setError(signed.error);
    }

    let done = 0;
    setProgress(`Otpremljeno 0 od ${files.length}`);
    const results = await Promise.allSettled(
      signed.data.map(async ({ path, uploadUrl }, index) => {
        const body = new FormData();
        body.append("cacheControl", "31536000");
        body.append("", files[index]);
        const response = await fetch(uploadUrl, { method: "PUT", body });
        if (!response.ok) throw new Error(String(response.status));
        setProgress(`Otpremljeno ${++done} od ${files.length}`);
        return path;
      }),
    );
    const paths = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    const failed = files.length - paths.length;

    if (paths.length > 0) {
      const attached = await attachProductImages(productId, paths);
      if (!attached.ok) setError(attached.error);
    }
    if (failed > 0) setError(`${failed} od ${files.length} fotografija nije otpremljeno. Pokušajte ponovo.`);

    setWarnings(found);
    setProgress(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy) void upload(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 border border-dashed px-5 py-8 text-center transition-colors",
          dragging ? "border-ink bg-surface" : "border-hairline",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={PRODUCT_IMAGE_TYPES.join(",")}
          multiple
          className="sr-only"
          id="fotografije-upload"
          disabled={busy || left <= 0}
          onChange={(event) => event.target.files && void upload(event.target.files)}
        />
        <label
          htmlFor="fotografije-upload"
          className={cn(
            "cursor-pointer border border-ink px-5 py-3 label text-ink transition-colors hover:bg-ink hover:text-surface",
            (busy || left <= 0) && "pointer-events-none opacity-50",
          )}
        >
          {busy ? (progress ?? "Otpremanje…") : "Dodaj fotografije"}
        </label>
        <p className="text-caption text-ink-muted">ili ih prevucite ovde · više odjednom</p>
        <p className="max-w-xl text-caption text-ink-muted">{PRODUCT_IMAGE_HINT}</p>
      </div>
      {error ? <p className="text-caption text-accent">{error}</p> : null}
      {warnings.length > 0 ? (
        <div className="flex flex-col gap-1 text-caption text-ink">
          <p>Otpremljeno, ali proverite:</p>
          {warnings.map((warning) => (
            <p key={warning} className="text-ink-muted">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ImageCard({
  image,
  index,
  total,
  colors,
}: {
  image: ProductImageData;
  index: number;
  total: number;
  colors: ColorOption[];
}) {
  const [alt, setAlt] = useState(image.alt);
  const [variantId, setVariantId] = useState(image.variantId ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = alt !== image.alt || variantId !== (image.variantId ?? "");

  function run(task: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setMessage({ error: true, text: result.error ?? "Greška." });
      else if (success) setMessage({ text: success });
    });
  }

  return (
    <li className={cn("flex flex-col gap-3", pending && "opacity-60")}>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
        {image.src ? (
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 80rem) 15vw, 45vw" className="object-cover" />
        ) : null}
        {index === 0 ? (
          <span className="absolute top-2 left-2 bg-ink px-2 py-1 text-[0.625rem] tracking-[0.1em] text-surface uppercase">
            Glavna
          </span>
        ) : index === 1 ? (
          <span className="absolute top-2 left-2 bg-surface-raised px-2 py-1 text-[0.625rem] tracking-[0.1em] text-ink uppercase">
            Na prelaz mišem
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button
            type="button"
            aria-label="Pomeri levo"
            disabled={pending || index === 0}
            onClick={() => run(() => moveProductImage(image.id, -1))}
            className={smallButton}
          >
            ← Levo
          </button>
          <button
            type="button"
            aria-label="Pomeri desno"
            disabled={pending || index === total - 1}
            onClick={() => run(() => moveProductImage(image.id, 1))}
            className={smallButton}
          >
            Desno →
          </button>
        </div>
        {!confirmDelete ? (
          <button type="button" disabled={pending} onClick={() => setConfirmDelete(true)} className={smallButton}>
            Obriši
          </button>
        ) : null}
      </div>

      {confirmDelete ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-caption text-ink">Obrisati?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => deleteProductImage(image.id))}
            className={cn(smallButton, "text-accent")}
          >
            Da
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)} className={smallButton}>
            Ne
          </button>
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.6875rem] tracking-[0.08em] text-ink-muted uppercase">Opis fotografije</span>
        <input value={alt} maxLength={200} onChange={(event) => setAlt(event.target.value)} className={input} />
      </label>

      {colors.length > 0 ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.6875rem] tracking-[0.08em] text-ink-muted uppercase">Boja</span>
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)} className={input}>
            <option value="">Sve boje</option>
            {colors.map((color) => (
              <option key={color.variantId} value={color.variantId}>
                {color.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {changed ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => updateProductImage({ imageId: image.id, alt, variantId }), "Sačuvano.")}
          className={cn(smallButton, "self-start text-ink")}
        >
          Sačuvaj
        </button>
      ) : null}
      {message ? (
        <p className={cn("text-caption", message.error ? "text-accent" : "text-ink-muted")}>{message.text}</p>
      ) : null}
    </li>
  );
}

/**
 * Galerija proizvoda u adminu: upload (pravo u Supabase Storage), redosled, opis i boja.
 * Opis (alt) čitaju Google i čitači ekrana: kratko šta se vidi, npr. „Krem pled preko naslona sofe“.
 */
export function ProductImages({
  productId,
  images,
  colors,
}: {
  productId: string;
  images: ProductImageData[];
  colors: ColorOption[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 2xl:grid-cols-4">
          {images.map((image, index) => (
            <ImageCard key={image.id} image={image} index={index} total={images.length} colors={colors} />
          ))}
        </ul>
      ) : null}
      <Uploader productId={productId} current={images.length} />
      {colors.length > 0 ? (
        <p className="text-caption text-ink-muted">
          Fotografija vezana za boju prikazuje se kad kupac izabere tu boju. „Sve boje“ se prikazuje uvek.
        </p>
      ) : null}
    </div>
  );
}