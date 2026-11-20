"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Tačka fokusa: klik na fotografiju označava deo koji mora ostati u kadru kad se slika seče
 * (široko na računaru, uspravno na telefonu). Vrednosti idu u formu kao skrivena polja.
 */
export function FocalPicker({
  src,
  mobileSrc,
  defaultX,
  defaultY,
  nameX,
  nameY,
}: {
  src: string;
  mobileSrc: string | null;
  defaultX: number;
  defaultY: number;
  nameX: string;
  nameY: string;
}) {
  const [point, setPoint] = useState({ x: defaultX, y: defaultY });
  const position = `${point.x}% ${point.y}%`;

  return (
    <div className="flex flex-col gap-4">
      <p className="label text-ink-muted">Tačka fokusa</p>
      <input type="hidden" name={nameX} value={point.x} />
      <input type="hidden" name={nameY} value={point.y} />

      <button
        type="button"
        aria-label="Kliknite na deo fotografije koji mora ostati u kadru"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
          const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
          setPoint({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
        }}
        className="relative block w-full max-w-xl cursor-crosshair overflow-hidden bg-surface-sunken"
      >
        {/* Cela fotografija, bez sečenja, da se vidi gde je tačka. */}
        <Image src={src} alt="" width={1200} height={800} sizes="36rem" className="h-auto w-full" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-kamen-svetli shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        />
      </button>
      <p className="text-caption text-ink-muted">
        Kliknite na najvažniji deo fotografije. Ispod je pregled kako se seče; sačuvajte dugmetom na dnu forme.
      </p>

      <div className="flex items-end gap-4">
        <figure className="flex w-full max-w-sm flex-col gap-1.5">
          <div className="relative aspect-[16/7] overflow-hidden bg-surface-sunken">
            <Image src={src} alt="" fill sizes="24rem" className="object-cover" style={{ objectPosition: position }} />
          </div>
          <figcaption className="text-caption text-ink-muted">Računar</figcaption>
        </figure>
        <figure className="flex w-24 shrink-0 flex-col gap-1.5">
          <div className="relative aspect-[9/16] overflow-hidden bg-surface-sunken">
            <Image
              src={mobileSrc ?? src}
              alt=""
              fill
              sizes="6rem"
              className="object-cover"
              style={{ objectPosition: position }}
            />
          </div>
          <figcaption className="text-caption text-ink-muted">Telefon</figcaption>
        </figure>
      </div>
    </div>
  );
}