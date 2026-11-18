/** Podaci porudžbine kako ih mejlovi prikazuju (već pripremljeni na serveru). */
export type EmailOrderItem = {
  name: string;
  variantLabel: string | null;
  sku: string;
  quantity: number;
  unitPriceRsd: number;
  lineTotalRsd: number;
  /** Apsolutna adresa fotografije (mejl je otvara sa interneta) ili null. */
  imageUrl: string | null;
};

export type EmailOrder = {
  id: string;
  /** „MH-1002“ */
  number: string;
  /** „18. 11. 2026.“ */
  date: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  note: string | null;
  subtotalRsd: number;
  shippingRsd: number;
  totalRsd: number;
  items: EmailOrderItem[];
};

/** Probna porudžbina za pregled mejlova u razvoju (/dev/mailovi). */
export const SAMPLE_ORDER: EmailOrder = {
  id: "primer",
  number: "MH-1002",
  date: "18. 11. 2026.",
  fullName: "Danaja Maras",
  email: "danaja@primer.rs",
  phone: "062 933 1164",
  address: "Gandijeva 205",
  postalCode: "11070",
  city: "Beograd",
  note: "Molim pozvati pola sata pre dolaska.",
  subtotalRsd: 11300,
  shippingRsd: 0,
  totalRsd: 11300,
  items: [
    {
      name: "Vafl peškir",
      variantLabel: "Lan · 70 × 140 cm",
      sku: "PES-VAF-LAN-70",
      quantity: 2,
      unitPriceRsd: 2400,
      lineTotalRsd: 4800,
      imageUrl: null,
    },
    {
      name: "Pled od merino vune",
      variantLabel: "Kamen · 130 × 170 cm",
      sku: "PLD-MER-KAM",
      quantity: 1,
      unitPriceRsd: 6500,
      lineTotalRsd: 6500,
      imageUrl: null,
    },
  ],
};