/**
 * Fotografije koje nisu proizvodi (sobe, kampanje, početna): dozvoljeni formati, veličina i
 * preporučene dimenzije za svako mesto na sajtu. Isti Supabase bucket „media“ kao proizvodi.
 */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_MAX_MB = 5;

/** Folderi u bucketu; server prihvata samo putanje iz ovih foldera. */
export const MEDIA_FOLDERS = ["sobe", "kampanje", "pocetna"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export type ImageSpec = { width: number; height: number; ratio: string };

export const ROOM_IMAGE_SPECS = {
  /** Kartica u bloku „Sobe“ na početnoj (3:4). */
  card: { width: 1500, height: 2000, ratio: "3:4" },
  /** Hero preko cele širine na računaru. */
  hero: { width: 2400, height: 1050, ratio: "16:7" },
  /** Hero na telefonu (uspravno). */
  heroMobile: { width: 1080, height: 1350, ratio: "4:5" },
  /** Editorijal u mreži proizvoda (3:2). */
  editorial: { width: 2400, height: 1600, ratio: "3:2" },
} satisfies Record<string, ImageSpec>;

export const CAMPAIGN_IMAGE_SPECS = {
  /** Hero na računaru; isti kadar služi za sva tri rasporeda (seče se po tački fokusa). */
  hero: { width: 2400, height: 1350, ratio: "16:9" },
  /** Hero na telefonu (uspravno). */
  heroMobile: { width: 1080, height: 1350, ratio: "4:5" },
  /** Editorijal: na računaru široko (16:7), na telefonu uspravno (4:5); predmet u sredini kadra. */
  editorial: { width: 2400, height: 1600, ratio: "3:2" },
} satisfies Record<string, ImageSpec>;

export function imageSpecHint(spec: ImageSpec) {
  return `Preporučeno ${spec.width} × ${spec.height} px (${spec.ratio}), JPG, WebP ili PNG, do ${IMAGE_MAX_MB} MB.`;
}

/**
 * Adrese koje sajt već koristi ili će koristiti. Sobe stoje direktno ispod domena
 * (monahome.rs/spavaca-soba), pa soba ne sme da dobije nijedan od ovih linkova.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "dev",
  "uskoro",
  "kolekcija",
  "korpa",
  "lozinka",
  "placanje",
  "porudzbina",
  "prijava",
  "proizvod",
  "nalog",
  "partner",
  "pretraga",
  "kontakt",
  "o-nama",
  "dostava",
  "uslovi-kupovine",
  "politika-privatnosti",
  "reklamacije",
  "pokloni",
  "pregled",
  "sitemap",
  "robots",
]);