import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Naslov stranice admina sa opisom i (opciono) dugmadima desno. */
export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[2.25rem] leading-none tracking-[-0.015em] text-ink md:text-display-2">{title}</h1>
        {description ? <p className="max-w-xl text-body text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}

/** Bela (kamen-svetla) površina za grupu sadržaja. */
export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border border-hairline bg-surface-raised", className)}>
      {title ? <h2 className="label border-b border-hairline px-5 py-4 text-ink md:px-6">{title}</h2> : null}
      <div className="px-5 py-4 md:px-6">{children}</div>
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-2 border border-hairline bg-surface-raised px-5 py-5 md:px-6">
      <p className="label text-ink-muted">{label}</p>
      <p className="font-display text-[2rem] leading-none text-ink">{value}</p>
      {note ? <p className="text-caption text-ink-muted">{note}</p> : null}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  NEW: "bg-accent text-on-accent",
  CONFIRMED: "bg-ink text-surface",
  SHIPPED: "border border-ink text-ink",
  DELIVERED: "border border-hairline text-ink-muted",
  CANCELLED: "border border-hairline text-ink-muted line-through",
};

/** Oznaka statusa porudžbine: nova je jedina u boji, jer jedina traži akciju. */
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center px-2 text-[0.6875rem] tracking-[0.08em] uppercase", STATUS_TONE[status])}>
      {label}
    </span>
  );
}

export const tableClass = "w-full text-left text-body";
export const thClass = "label border-b border-hairline px-3 py-3 font-normal text-ink-muted first:pl-0 last:pr-0";
export const tdClass = "border-b border-hairline px-3 py-3 align-middle text-ink first:pl-0 last:pr-0";