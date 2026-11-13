const rsd = new Intl.NumberFormat("sr-Latn-RS", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** 8900 → „8.900 RSD“ (tačka za hiljade, razmak, RSD). */
export function formatRsd(amount: number): string {
  return `${rsd.format(Math.round(amount))} RSD`;
}

const plural = new Intl.PluralRules("sr-Latn-RS");

/**
 * Broj sa pravilnim oblikom reči: 1 proizvod, 3 proizvoda, 12 proizvoda, 21 proizvod.
 * Oblici: [jedan, nekoliko (2–4), mnogo].
 */
export function formatCount(count: number, [one, few, many]: [string, string, string]): string {
  const rule = plural.select(count);
  const word = rule === "one" ? one : rule === "few" ? few : many;
  return `${count} ${word}`;
}

/** 1 → „MH-1001“. Redni broj iz baze je mali; prikaz počinje od 1001 da ne izgleda kao prva porudžbina. */
export function formatOrderNumber(number: number): string {
  return `MH-${1000 + number}`;
}