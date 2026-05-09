"use client";

import { useEffect, useState, useCallback } from "react";

export type Preference = "love" | "hate";

export interface PreferenceMap {
  /** Direct rating per recipe ID. */
  items: Record<string, Preference>;
  /** When the map was last updated. */
  updatedAt: number;
}

const STORAGE_KEY = "dinemate.preferences.v1";

const EMPTY: PreferenceMap = { items: {}, updatedAt: 0 };

function safeRead(): PreferenceMap {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as PreferenceMap;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      items: parsed.items ?? {},
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch {
    return EMPTY;
  }
}

function safeWrite(map: PreferenceMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota errors etc — drop silently */
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<PreferenceMap>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate after mount to avoid SSR mismatch.
  useEffect(() => {
    setPrefs(safeRead());
    setHydrated(true);
  }, []);

  const setRating = useCallback(
    (recipeId: string, rating: Preference | null) => {
      setPrefs((prev) => {
        const items = { ...prev.items };
        if (rating === null) {
          delete items[recipeId];
        } else {
          items[recipeId] = rating;
        }
        const next: PreferenceMap = { items, updatedAt: Date.now() };
        safeWrite(next);
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => {
    const next = { ...EMPTY, updatedAt: Date.now() };
    safeWrite(next);
    setPrefs(next);
  }, []);

  return { prefs, setRating, clear, hydrated };
}

export function ratingFor(
  prefs: PreferenceMap,
  recipeId: string
): Preference | null {
  return prefs.items[recipeId] ?? null;
}

export function countByRating(prefs: PreferenceMap): {
  loved: number;
  hated: number;
} {
  let loved = 0;
  let hated = 0;
  for (const r of Object.values(prefs.items)) {
    if (r === "love") loved++;
    else if (r === "hate") hated++;
  }
  return { loved, hated };
}
