// src/components/ui/turnstile.tsx
"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/** Ako Cloudflare ne odgovori (blokator reklama, loša mreža), forma se posle ovoliko ipak šalje; server odlučuje. */
const GIVE_UP_MS = 8000;

/**
 * Cloudflare Turnstile unutar forme. Većina kupaca ga ne vidi („interaction-only“):
 * provera radi u pozadini, a polje se pojavi samo kad Cloudflare traži klik.
 * Token ide u skriveno polje „cf-turnstile-response“, koje server proverava (src/server/turnstile.ts).
 *
 * Ako kupac klikne pre nego što token stigne (prve sekunde posle učitavanja, automatsko popunjavanje lozinke),
 * slanje se zadrži i forma se pošalje sama čim token stigne. Zato forme ne moraju ništa da znaju o Turnstile-u.
 *
 * `resetKey`: kad se promeni (novi odgovor forme), widget pravi novi token, jer se token može iskoristiti samo jednom.
 */
export function Turnstile({ action, resetKey, className }: { action: string; resetKey?: unknown; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const waitingRef = useRef(false);
  const bypassRef = useRef(false);
  const previousKey = useRef(resetKey);
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState(false);

  /** Pošalji zadržanu formu (posle tokena, greške ili isteka vremena). */
  function releaseHeldSubmit() {
    if (!waitingRef.current) return;
    waitingRef.current = false;
    setWaiting(false);
    bypassRef.current = true;
    containerRef.current?.closest("form")?.requestSubmit();
  }

  // Zadržavanje slanja dok token ne stigne. Sluša se u capture fazi, pre Reactovog rukovanja formom.
  useEffect(() => {
    const form = containerRef.current?.closest("form");
    if (!SITE_KEY || !form) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    function onSubmit(event: SubmitEvent) {
      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }
      if (tokenRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (waitingRef.current) return;
      waitingRef.current = true;
      setWaiting(true);
      timer = setTimeout(releaseHeldSubmit, GIVE_UP_MS);
    }

    form.addEventListener("submit", onSubmit, { capture: true });
    return () => {
      form.removeEventListener("submit", onSubmit, { capture: true });
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!ready || !SITE_KEY || !container || !window.turnstile) return;
    const widgetId = window.turnstile.render(container, {
      sitekey: SITE_KEY,
      action,
      appearance: "interaction-only",
      size: "flexible",
      theme: "light",
      callback: (token: string) => {
        tokenRef.current = token;
        releaseHeldSubmit();
      },
      "expired-callback": () => {
        tokenRef.current = null;
      },
      // Greška kod Cloudflare-a: forma se ipak šalje, a server vraća jasnu poruku umesto da dugme ne radi ništa.
      "error-callback": () => {
        tokenRef.current = null;
        releaseHeldSubmit();
      },
    });
    widgetRef.current = widgetId;
    return () => {
      window.turnstile?.remove(widgetId);
      widgetRef.current = null;
      tokenRef.current = null;
    };
  }, [ready, action]);

  useEffect(() => {
    if (previousKey.current === resetKey) return;
    previousKey.current = resetKey;
    tokenRef.current = null;
    if (widgetRef.current) window.turnstile?.reset(widgetRef.current);
  }, [resetKey]);

  // Bez ključa (lokalno, bez .env.local) nema widgeta; server tada propušta van produkcije.
  if (!SITE_KEY) return null;

  return (
    <>
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={containerRef} className={className} />
      {waiting ? (
        <p role="status" className="text-caption text-ink-muted">
          Bezbednosna provera je u toku, forma će biti poslata za trenutak…
        </p>
      ) : null}
    </>
  );
}