"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/brand/logo";
import { ROLE_LABEL } from "@/lib/auth-forms";
import { cn } from "@/lib/cn";
import { logout } from "@/server/auth/actions";
import type { CurrentUser } from "@/server/auth/guard";

type NavItem = { href: string; label: string; exact?: boolean; soon?: boolean };

// „soon“: sekcije koje se prave u sledećim koracima; vidljive su da se zna šta dolazi.
const NAV: NavItem[] = [
  { href: "/admin", label: "Pregled", exact: true },
  { href: "/admin/porudzbine", label: "Porudžbine" },
  { href: "/admin/proizvodi", label: "Proizvodi"},
  { href: "/admin/sobe", label: "Sobe" },
  { href: "/admin/kampanje", label: "Kampanje", soon: true },
  { href: "/admin/pocetna", label: "Početna", soon: true },
  { href: "/admin/tekstovi", label: "Tekstovi i stranice", soon: true },
  { href: "/admin/korisnici", label: "Korisnici" },
];

function NavLinks({ pathname, newOrders }: { pathname: string; newOrders: number }) {
  return (
    <ul className="flex flex-col">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        if (item.soon) {
          return (
            <li key={item.href} className="flex items-center justify-between px-3 py-2.5 text-body text-ink-muted/60">
              {item.label}
              <span className="text-[0.625rem] tracking-[0.1em] uppercase">uskoro</span>
            </li>
          );
        }
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block px-3 py-2.5 text-body transition-colors",
                active ? "bg-surface-raised text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                {item.label}
                {item.href === "/admin/porudzbine" && newOrders > 0 ? (
                  <span
                    aria-label={`${newOrders} novih`}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.6875rem] text-on-accent"
                  >
                    {newOrders}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Account({ user }: { user: CurrentUser }) {
  return (
    <div className="flex flex-col gap-4 border-t border-hairline px-3 pt-5">
      <div>
        <p className="truncate text-body text-ink">{user.name ?? user.email}</p>
        <p className="text-caption text-ink-muted">{ROLE_LABEL[user.role]}</p>
      </div>
      <div className="flex items-center gap-5">
        <Link
          href="/"
          target="_blank"
          className="text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Pogledaj sajt
        </Link>
        <form action={logout}>
          <button type="submit" className="text-caption text-ink-muted underline underline-offset-4 hover:text-ink">
            Odjava
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Okvir admina: tamna bočna traka sa menijem na desktopu, traka sa padajućim menijem na telefonu.
 * Ovo je samo izgled; pristup proverava server (requireRole) na svakoj stranici i akciji.
 */
export function AdminShell({
  user,
  newOrders,
  children,
}: {
  user: CurrentUser;
  newOrders: number;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside
        data-theme="espreso"
        className="hidden bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-10 lg:px-4 lg:py-8"
      >
        <Link href="/admin" className="flex items-baseline gap-3 px-3 text-ink">
          <Wordmark className="h-5 w-auto" aria-hidden="true" />
          <span className="label text-ink-muted">Admin</span>
        </Link>
        <nav aria-label="Admin meni" className="flex-1 overflow-y-auto">
          <NavLinks pathname={pathname} newOrders={newOrders} />
        </nav>
        <Account user={user} />
      </aside>

      {/* Telefon i tablet */}
      <header data-theme="espreso" className="sticky top-0 z-30 bg-surface lg:hidden">
        <details key={pathname} className="group">
          <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-baseline gap-3 text-ink">
              <Wordmark className="h-4 w-auto" aria-hidden="true" />
              <span className="label text-ink-muted">Admin</span>
            </span>
            <span className="label text-ink">
              <span className="group-open:hidden">Meni</span>
              <span className="hidden group-open:inline">Zatvori</span>
            </span>
          </summary>
          <div className="flex flex-col gap-6 border-t border-hairline px-2 pt-3 pb-6">
            <NavLinks pathname={pathname} newOrders={newOrders} />
            <Account user={user} />
          </div>
        </details>
      </header>

      <main className="min-w-0 px-5 py-8 md:px-10 md:py-12">{children}</main>
    </div>
  );
}