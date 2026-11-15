import type { ReactNode } from "react";

/** Uzak, miran okvir za stranice naloga (prijava, lozinka), u stilu prodavnice. */
export function AuthCard({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-md flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="eyebrow text-ink-muted">{eyebrow}</p>
          <h1 className="font-display text-[2.75rem] leading-none tracking-[-0.015em] text-ink italic md:text-display-1">{title}</h1>
          {intro ? <p className="text-body text-ink-muted">{intro}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormNotice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "border-l-2 border-accent bg-surface-raised px-4 py-3 text-body text-ink"
          : "border-l-2 border-ink bg-surface-raised px-4 py-3 text-body text-ink"
      }
    >
      {children}
    </p>
  );
}