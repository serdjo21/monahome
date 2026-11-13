import { z } from "zod";

/** Podaci kupca sa forme za plaćanje. Ista pravila važe na serveru; klijent koristi samo tipove. */
export const checkoutSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Unesite ispravnu e-mail adresu." }).max(254)),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s/-]{5,19}$/, { error: "Unesite ispravan broj telefona." }),
  fullName: z
    .string()
    .trim()
    .min(3, { error: "Unesite ime i prezime." })
    .max(100, { error: "Ime i prezime je predugačko." }),
  address: z
    .string()
    .trim()
    .min(3, { error: "Unesite ulicu i broj." })
    .max(200, { error: "Adresa je predugačka." }),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, { error: "Poštanski broj ima 5 cifara." }),
  city: z
    .string()
    .trim()
    .min(2, { error: "Unesite mesto." })
    .max(100, { error: "Naziv mesta je predugačak." }),
  note: z
    .string()
    .trim()
    .max(500, { error: "Napomena može imati najviše 500 znakova." })
    .transform((value) => value || null),
  terms: z.literal("on", { error: "Potrebna je saglasnost sa uslovima kupovine." }),
});

export type CheckoutField = keyof z.input<typeof checkoutSchema>;
export const CHECKOUT_FIELDS = Object.keys(checkoutSchema.shape) as CheckoutField[];

export type CheckoutValues = Partial<Record<CheckoutField, string>>;

export type StockAdjustment = { variantId: string; available: number };

export type CheckoutState =
  | { status: "idle" }
  | {
      status: "error";
      /** Uneto, da se forma ne isprazni posle greške. */
      values: CheckoutValues;
      fieldErrors?: Partial<Record<CheckoutField, string>>;
      formError?: string;
      /** Kad je nečega u međuvremenu nestalo: nove dozvoljene količine za korpu. */
      adjustments?: StockAdjustment[];
    }
  | { status: "success"; href: string };