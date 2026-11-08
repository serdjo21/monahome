import type { Media } from "./types";

/**
 * Pretvara putanju iz baze (npr. "proizvodi/pled-merino/1.jpg") u pun URL slike u Supabase Storage-u.
 * Prazna putanja ili nepodešen projekat znači da fotografija još ne postoji.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Putanja koja počinje sa „/“ je fajl iz foldera public (probne slike u razvoju).
  if (path.startsWith("/")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/media/${path}`;
}


export function toMedia(path: string | null | undefined, alt: string | null | undefined, fallbackAlt = ""): Media {
  return { src: mediaUrl(path), alt: alt ?? fallbackAlt };
}