"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const getSnapshot = () => window.location.search;
// Na serveru (i pri hidrataciji) nema parametara; stranica ostaje statična, a izbor se primeni odmah posle.
const getServerSnapshot = () => "";

/**
 * Query string kao stanje komponente. Izmena ide kroz replaceState:
 * bez nove stavke u istoriji, bez navigacije i bez ponovnog renderovanja stranice na serveru.
 */
export function useUrlSearch() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((changes: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    listeners.forEach((listener) => listener());
  }, []);

  return [search, update] as const;
}