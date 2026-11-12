"use client";

import { useSyncExternalStore } from "react";

import { MAX_CART_LINES, MAX_LINE_QUANTITY, type CartItem } from "./types";

/**
 * Korpa u browseru (localStorage). Jedan izvor istine za sve komponente:
 * dugme „Dodaj u korpu“, brojač u headeru, panel i stranicu /korpa.
 * Menja se samo kroz funkcije ispod; promena u drugom tabu stiže preko „storage“ događaja.
 */

const STORAGE_KEY = "monahome:korpa:v1";
const EMPTY: CartItem[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

function parse(raw: string | null): CartItem[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    return data
      .filter(
        (item): item is CartItem =>
          typeof item === "object" &&
          item !== null &&
          typeof item.variantId === "string" &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0,
      )
      .slice(0, MAX_CART_LINES)
      .map((item) => ({ variantId: item.variantId, quantity: Math.min(item.quantity, MAX_LINE_QUANTITY) }));
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // privatni režim ili blokiran storage: korpa radi samo dok je stranica otvorena
  }
}

// Ista referenca dok se sadržaj ne promeni, kako useSyncExternalStore traži.
function getSnapshot(): CartItem[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parse(raw);
  }
  return cachedItems;
}

const getServerSnapshot = () => EMPTY;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(items: CartItem[]) {
  const raw = JSON.stringify(items);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // bez storage-a: zadrži u memoriji
  }
  cachedRaw = raw;
  cachedItems = items;
  emit();
}

/** Trenutni sadržaj korpe van Reacta (npr. posle odgovora sa servera). */
export const getCartItems = getSnapshot;

export function useCartItems(): CartItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noopSubscribe = () => () => {};

/** false na serveru i pri hidrataciji, true čim je korpa iz browsera dostupna (sprečava „prazna korpa“ treptaj). */
export function useCartReady(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useCartCount(): number {
  return useCartItems().reduce((sum, item) => sum + item.quantity, 0);
}

/** Dodaje količinu; ukupno za varijantu ne prelazi `max` (stanje na lageru). */
export function addToCart(variantId: string, quantity: number, max = MAX_LINE_QUANTITY) {
  const items = getSnapshot();
  const limit = Math.min(max, MAX_LINE_QUANTITY);
  const existing = items.find((item) => item.variantId === variantId);
  if (existing) {
    write(
      items.map((item) =>
        item.variantId === variantId ? { ...item, quantity: Math.min(item.quantity + quantity, limit) } : item,
      ),
    );
  } else if (items.length < MAX_CART_LINES) {
    write([...items, { variantId, quantity: Math.min(quantity, limit) }]);
  }
}

export function setCartQuantity(variantId: string, quantity: number) {
  if (quantity <= 0) return removeFromCart([variantId]);
  write(
    getSnapshot().map((item) =>
      item.variantId === variantId ? { ...item, quantity: Math.min(quantity, MAX_LINE_QUANTITY) } : item,
    ),
  );
}

export function removeFromCart(variantIds: string[]) {
  write(getSnapshot().filter((item) => !variantIds.includes(item.variantId)));
}

export function clearCart() {
  write(EMPTY);
}

// ─── Otvoren / zatvoren panel ───────────────────────────────

const openListeners = new Set<() => void>();
let isOpen = false;

function setOpen(value: boolean) {
  if (isOpen === value) return;
  isOpen = value;
  openListeners.forEach((listener) => listener());
}

export const openCart = () => setOpen(true);
export const closeCart = () => setOpen(false);

export function useCartOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      openListeners.add(listener);
      return () => openListeners.delete(listener);
    },
    () => isOpen,
    () => false,
  );
}