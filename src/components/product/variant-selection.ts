import { slugify } from "@/lib/slug";
import type { ProductDetail, ProductImageItem, ProductVariantOption } from "@/server/storefront/types";

export type Selection = {
  color: string | null;
  size: string | null;
  variant: ProductVariantOption | null;
};

/** Varijanta za tačnu kombinaciju boje i veličine (null polja se porede kao „nema“). */
export function findVariant(product: ProductDetail, color: string | null, size: string | null) {
  return product.variants.find((v) => v.colorName === color && v.size === size) ?? null;
}

export function isColorAvailable(product: ProductDetail, color: string) {
  return product.variants.some((v) => v.colorName === color && v.available > 0);
}

/**
 * Izbor iz URL-a (?boja=kamen&velicina=70-140-cm). Nepoznato ili prazno:
 * prva boja koje ima na stanju, pa prva veličina koje te boje ima na stanju.
 */
export function resolveSelection(product: ProductDetail, search: string): Selection {
  const params = new URLSearchParams(search);
  const colorNames = product.colors.map((c) => c.name);

  const wantedColor = params.get("boja");
  const color =
    colorNames.length === 0
      ? null
      : (colorNames.find((name) => slugify(name) === wantedColor) ??
        colorNames.find((name) => isColorAvailable(product, name)) ??
        colorNames[0]);

  const wantedSize = params.get("velicina");
  const size =
    product.sizes.length === 0
      ? null
      : (product.sizes.find((s) => slugify(s) === wantedSize) ??
        product.sizes.find((s) => (findVariant(product, color, s)?.available ?? 0) > 0) ??
        product.sizes[0]);

  return { color, size, variant: findVariant(product, color, size) };
}

/** Fotografije izabrane boje i one koje važe za sve; ako boja nema svoje, sve fotografije. */
export function imagesForColor(product: ProductDetail, color: string | null): ProductImageItem[] {
  if (!color) return product.images;
  const matching = product.images.filter((image) => image.colorName === color || image.colorName === null);
  return matching.length > 0 ? matching : product.images;
}