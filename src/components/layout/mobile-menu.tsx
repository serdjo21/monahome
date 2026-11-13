"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";
import { socialLinks } from "@/config/navigation";
import type { NavLink } from "@/server/storefront/types";
const PANEL_ID = "mobilni-meni";

// Portal sme da se renderuje tek na klijentu (document ne postoji na serveru).
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

/**
 * Meni za ekrane uže od xl: hamburger desno u headeru, panel klizi zdesna nalevo ispod headera.
 * Header ostaje vidljiv, pa se ista ikonica pretvara u X i nazad.
 * Pristupačnost: Esc zatvara, fokus ide u meni i vraća se na dugme, sadržaj ispod je inertan.
 */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

 

  useEffect(() => {
    const main = document.getElementById("sadrzaj");
    const footer = document.querySelector("footer");

    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    panelRef.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 80rem)").matches) setOpen(false);
    };
        const onPopState = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Zatvori meni" : "Otvori meni"}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((value) => !value)}
        className="-mr-2.5 inline-flex size-11 items-center justify-center text-ink xl:hidden"
      >
        <span aria-hidden="true" className="relative block h-3.5 w-6">
          <span
            className={cn(
              "absolute inset-x-0 top-0 h-px bg-current transition-transform duration-500 ease-editorial",
              open && "translate-y-[7px] rotate-45",
            )}
          />
          <span
            className={cn(
              "absolute inset-x-0 top-[7px] h-px bg-current transition-[opacity,transform] duration-300 ease-editorial",
              open && "scale-x-0 opacity-0",
            )}
          />
          <span
            className={cn(
              "absolute inset-x-0 top-[14px] h-px bg-current transition-transform duration-500 ease-editorial",
              open && "-translate-y-[7px] -rotate-45",
            )}
          />
        </span>
      </button>

      {isClient
        ? createPortal(
            <div className="xl:hidden">
              <div
                aria-hidden="true"
                onClick={close}
                className={cn(
                  "fixed inset-x-0 top-16 bottom-0 z-30 bg-espreso/30 transition-opacity duration-500 ease-editorial",
                  open ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              />

              <div
                ref={panelRef}
                id={PANEL_ID}
                role="dialog"
                aria-modal="true"
                aria-label="Meni"
                inert={!open}
                data-theme="kamen"
                className={cn(
                  "fixed top-16 right-0 bottom-0 z-30 flex w-full flex-col border-l border-hairline transition-transform duration-500 ease-editorial sm:max-w-md",
                  open ? "translate-x-0" : "translate-x-full",
                )}
              >
                <nav aria-label="Glavni meni" className="flex-1 overflow-y-auto px-5 py-8 md:px-10">
                  <ul className="flex flex-col">
                    {links.map((link, index) => (
                      <li
                        key={link.href}
                        className={cn(
                          "border-b border-hairline transition-[opacity,transform] duration-500 ease-editorial",
                          open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
                        )}
                        style={{ transitionDelay: open ? `${120 + index * 50}ms` : "0ms" }}
                      >
                        <Link href={link.href} onClick={close} className="group flex flex-col gap-1 py-5">
                          <span className="font-display text-display-3 text-ink transition-colors group-hover:text-ink-muted">
                            {link.label}
                          </span>
                          {link.note ? <span className="text-caption text-ink-muted">{link.note}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <ul className="mt-10 flex flex-col gap-5">
                    <li>
                      <Link href="/pretraga" onClick={close} className="label text-ink">
                        Pretraga
                      </Link>
                    </li>
                    <li>
                      <Link href="/kontakt" onClick={close} className="label text-ink">
                        Kontakt
                      </Link>
                    </li>
                  </ul>
                </nav>

                <div className="flex shrink-0 gap-8 border-t border-hairline px-5 py-6 md:px-10">
                  {socialLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label text-ink-muted hover:text-ink"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}