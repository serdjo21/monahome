/**
 * Datumi po beogradskom vremenu. Server (Vercel) radi u UTC-u, a kampanja „traje do 31. 12.“
 * mora da znači do ponoći u Beogradu, uključujući prelazak na letnje/zimsko vreme.
 */
const ZONE = "Europe/Belgrade";

const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** Date → „2026-12-31“ (dan u Beogradu), za <input type="date">. */
export function toBelgradeDateInput(value: Date | null | undefined): string {
  return value ? ymd.format(value) : "";
}

/** Razlika beogradskog vremena i UTC-a u minutima u datom trenutku (60 zimi, 120 leti). */
function offsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((local - at.getTime()) / 60_000);
}

/** „2026-12-01“ → početak tog dana u Beogradu (00:00), kao UTC Date. */
export function belgradeStartOfDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const guess = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(guess.getTime())) return null;
  return new Date(guess.getTime() - offsetMinutes(guess) * 60_000);
}

/** „2026-12-31“ → poslednji trenutak tog dana u Beogradu (23:59:59.999). */
export function belgradeEndOfDay(value: string): Date | null {
  const start = belgradeStartOfDay(value);
  if (!start) return null;
  const nextDay = new Date(start.getTime() + 36 * 3_600_000); // sigurno u sledećem danu
  const next = belgradeStartOfDay(toBelgradeDateInput(nextDay));
  return next ? new Date(next.getTime() - 1) : null;
}