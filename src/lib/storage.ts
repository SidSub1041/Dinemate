"use client";

/**
 * Generic localStorage state hook. Keeps a state value in sync with
 * window.localStorage and reacts to changes from other tabs.
 *
 * The shape of the data is intentionally flat so it maps cleanly onto
 * future Postgres tables when we add accounts in the next session.
 */

import { useCallback, useEffect, useState } from "react";

export const STORAGE_KEYS = {
  profile: "dinemate.profile.v1",
  plan: "dinemate.plan.v1",
  customMeals: "dinemate.customMeals.v1",
  eaten: "dinemate.eaten.v1",
  preferences: "dinemate.preferences.v1",
  history: "dinemate.history.v1",
} as const;

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const CUSTOM_EVENT = "dinemate:storage";

interface StorageBroadcast extends CustomEvent<{ key: string }> {}

function broadcast(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CUSTOM_EVENT, { detail: { key } }) as StorageBroadcast
  );
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    broadcast(key);
  } catch {
    /* quota / serialization errors — drop silently */
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
    broadcast(key);
  } catch {
    /* noop */
  }
}

/**
 * Returns [value, setter, hydrated]. hydrated is false until the first
 * post-mount effect runs — UIs should treat the value as "loading" until
 * then to avoid SSR/CSR mismatch flicker.
 */
export function useStoredState<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void, boolean, () => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(safeRead<T>(key, initial));
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setValue(safeRead<T>(key, initial));
      }
    };
    const onCustom = (e: Event) => {
      const det = (e as StorageBroadcast).detail;
      if (det?.key === key) {
        setValue(safeRead<T>(key, initial));
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CUSTOM_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CUSTOM_EVENT, onCustom as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function"
            ? (next as (p: T) => T)(prev)
            : next;
        safeWrite(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  const clear = useCallback(() => {
    safeRemove(key);
    setValue(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, set, hydrated, clear];
}

/** One-shot read for use outside React (e.g. in route loaders). */
export function readStored<T>(key: string, fallback: T): T {
  return safeRead(key, fallback);
}
