/** „Spavaća soba“ → „spavaca-soba“, „130 × 170 cm“ → „130-170-cm“. Za URL parametre i slugove. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}