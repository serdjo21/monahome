const rsd = new Intl.NumberFormat("sr-Latn-RS", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** 8900 → „8.900 RSD“ (tačka za hiljade, razmak, RSD). */
export function formatRsd(amount: number): string {
  return `${rsd.format(Math.round(amount))} RSD`;
}