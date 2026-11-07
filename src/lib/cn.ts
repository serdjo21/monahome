/** Spaja klase i preskače prazne vrednosti. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}