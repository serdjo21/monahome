import type { ProductDetail } from "@/server/storefront/types";

// Privremeno u kodu; seli se u podešavanja prodavnice kad napravimo admin.
const DELIVERY_TEXT =
  "Isporuka na teritoriji Srbije za 2–4 radna dana, plaćanje pouzećem prilikom preuzimanja.\nProizvod možete vratiti u roku od 14 dana od prijema, nekorišćen i u originalnom pakovanju.";

type Item = { title: string; body: string; open?: boolean };

/** Harmonika bez JavaScripta (<details>): opis otvoren, ostalo na klik. */
export function ProductDetails({ product }: { product: ProductDetail }) {
  const items: Item[] = [];
  if (product.description) items.push({ title: "Opis", body: product.description, open: true });
  if (product.care) items.push({ title: "Sastav i nega", body: product.care });
  items.push({ title: "Dostava i povraćaj", body: DELIVERY_TEXT });

  return (
    <div className="border-b border-hairline">
      {items.map((item) => (
        <details key={item.title} open={item.open} className="group border-t border-hairline">
          <summary className="label flex cursor-pointer list-none items-center justify-between py-5 text-ink [&::-webkit-details-marker]:hidden">
            {item.title}
            <span aria-hidden="true" className="relative size-3">
              <span className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-current" />
              <span className="absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-300 ease-editorial group-open:scale-y-0" />
            </span>
          </summary>
          <p className="pb-6 text-body whitespace-pre-line text-ink-muted">{item.body}</p>
        </details>
      ))}
    </div>
  );
}