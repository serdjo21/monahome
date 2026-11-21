"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import { formatRsd } from "@/lib/format";
import {
  addCampaignProduct,
  moveCampaignProduct,
  type ProductOption,
  removeCampaignProduct,
  searchCampaignProducts,
} from "@/server/admin/campaign-actions";

export type CampaignProductItem = ProductOption;

const smallButton =
  "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-40";
const arrow =
  "flex size-8 items-center justify-center border border-hairline text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30";

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="relative block h-15 w-12 shrink-0 overflow-hidden bg-surface-sunken">
      {src ? <Image src={src} alt="" fill sizes="48px" className="object-cover" /> : null}
    </span>
  );
}

/**
 * Proizvodi kampanje (karusel na početnoj i stranica kolekcije), tim redosledom.
 * Svaka promena se čuva odmah. Neobjavljen proizvod ostaje na spisku, ali se na sajtu ne vidi.
 */
export function CampaignProducts({ campaignId, items }: { campaignId: string; items: CampaignProductItem[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Pretraga sa malim zakašnjenjem, da ne ide upit na svako slovo.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const found = await searchCampaignProducts(campaignId, query);
      if (!cancelled) {
        setResults(found);
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [campaignId, query, items.length]);

  function run(task: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? "Greška.");
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", pending && "opacity-70")}>
      {items.length === 0 ? (
        <p className="text-body text-ink-muted">
          Kampanja još nema proizvoda. Bez njih se karusel na početnoj ne prikazuje.
        </p>
      ) : (
        <ol className="flex flex-col">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-4 border-b border-hairline py-3 last:border-b-0">
              <span className="w-5 text-caption text-ink-muted">{index + 1}</span>
              <Thumb src={item.src} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-ink">{item.name}</p>
                <p className="text-caption text-ink-muted">
                  {formatRsd(item.priceRsd)}
                  {item.status !== "ACTIVE" ? (
                    <span className="text-accent"> · nije objavljen, ne vidi se na sajtu</span>
                  ) : null}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Pomeri gore"
                  disabled={pending || index === 0}
                  onClick={() => run(() => moveCampaignProduct(campaignId, item.id, -1))}
                  className={arrow}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Pomeri dole"
                  disabled={pending || index === items.length - 1}
                  onClick={() => run(() => moveCampaignProduct(campaignId, item.id, 1))}
                  className={arrow}
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeCampaignProduct(campaignId, item.id))}
                className={smallButton}
              >
                Ukloni
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-3 border-t border-hairline pt-6">
        <label htmlFor="kampanja-pretraga" className="label text-ink">
          Dodaj proizvod
        </label>
        <input
          id="kampanja-pretraga"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Naziv ili šifra"
          className="h-11 max-w-md border border-hairline bg-transparent px-4 text-[16px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-ink md:text-body"
        />
        {results.length === 0 ? (
          <p className="text-caption text-ink-muted">{searching ? "Traženje…" : "Nema proizvoda za dodavanje."}</p>
        ) : (
          <ul className="flex max-w-2xl flex-col">
            {results.map((product) => (
              <li key={product.id} className="flex items-center gap-4 border-b border-hairline py-2.5 last:border-b-0">
                <Thumb src={product.src} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-ink">{product.name}</p>
                  <p className="text-caption text-ink-muted">
                    {formatRsd(product.priceRsd)}
                    {product.status !== "ACTIVE" ? " · nacrt" : null}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => addCampaignProduct(campaignId, product.id))}
                  className="border border-ink px-4 py-2 label text-ink transition-colors hover:bg-ink hover:text-surface disabled:opacity-50"
                >
                  Dodaj
                </button>
              </li>
            ))}
          </ul>
        )}
        {error ? <p className="text-caption text-accent">{error}</p> : null}
      </div>
    </div>
  );
}