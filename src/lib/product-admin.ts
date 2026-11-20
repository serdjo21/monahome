import type { ProductStatus } from "@/generated/prisma/enums";

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: "Objavljen",
  DRAFT: "Nacrt",
  ARCHIVED: "Arhiviran",
};

/** Statusi u URL-u liste (?status=nacrti). */
export const PRODUCT_STATUS_SLUGS: Record<string, ProductStatus> = {
  objavljeni: "ACTIVE",
  nacrti: "DRAFT",
  arhivirani: "ARCHIVED",
};

export const PRODUCT_TABS: { slug: string; label: string; status: ProductStatus | null }[] = [
  { slug: "svi", label: "Svi", status: null },
  { slug: "objavljeni", label: "Objavljeni", status: "ACTIVE" },
  { slug: "nacrti", label: "Nacrti", status: "DRAFT" },
  { slug: "arhivirani", label: "Arhivirani", status: "ARCHIVED" },
];

/**
 * Fotografije proizvoda: na sajtu se svuda prikazuju u odnosu 4:5 (uspravno).
 * 1600 × 2000 je dovoljno oštro i za najširu sliku galerije na retina ekranu.
 */
export const PRODUCT_IMAGE_SPEC = {
  width: 1600,
  height: 2000,
  ratio: "4:5",
  maxMb: 5,
  formats: "JPG, WebP ili PNG",
} as const;

export const PRODUCT_IMAGE_HINT =
  `Preporučeno ${PRODUCT_IMAGE_SPEC.width} × ${PRODUCT_IMAGE_SPEC.height} px (uspravno, ${PRODUCT_IMAGE_SPEC.ratio}), ` +
  `${PRODUCT_IMAGE_SPEC.formats}, do ${PRODUCT_IMAGE_SPEC.maxMb} MB. Proizvod u sredini kadra, jer se ivice mogu malo iseći.`;

/** Ispod ovoliko komada (a više od nule) lager se ističe u listi. */
export const LOW_STOCK = 3;


export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PRODUCT_IMAGES = 20;