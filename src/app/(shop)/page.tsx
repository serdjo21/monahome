import { Monogram, Wordmark } from "@/components/brand/logo";

export default function Page() {
  return (
    <main className="container-page flex flex-col gap-6 py-section">
      <div className="flex items-center gap-6">
  <Wordmark className="h-8 w-auto text-ink" />
  <Monogram className="size-12" />
</div>
      <p className="eyebrow text-ink-muted">Jesen / zima 2026</p>
      <h1 className="font-display text-display-1 italic">Toplina koja se oseća.</h1>
      <p className="max-w-md text-body-lg text-ink-muted">
        Čćšžđ test: pledovi od vune, lan u slojevima i teški pamuk.
      </p>
      <section data-theme="espreso" className="p-10">
        <p className="label">Espreso sekcija</p>
        <p className="mt-3 font-display text-display-3">Boje se same obrnu.</p>
      </section>
    </main>
  );
}