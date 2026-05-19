"use client";

/**
 * Application-level data hooks built on the localStorage primitives.
 * Each hook returns a typed slice + setter + hydrated flag.
 *
 * These hooks are the source of truth for app state across routes.
 * When the NextAuth + Postgres backend lands, the storage layer
 * underneath swaps out without these signatures changing.
 */

import { useMemo, useCallback } from "react";
import { useStoredState, STORAGE_KEYS } from "./storage";
import type {
  MealSelection,
  PlanResult,
  UserProfile,
  Allergen,
  DietPreference,
} from "./types";

// ============================== Profile ==============================

export function useProfile() {
  const [profile, setProfile, hydrated, clear] = useStoredState<
    UserProfile | null
  >(STORAGE_KEYS.profile, null);
  return { profile, setProfile, hydrated, clear };
}

// ============================== Plan ==============================

export function useStoredPlan() {
  const [plan, setPlan, hydrated, clear] = useStoredState<PlanResult | null>(
    STORAGE_KEYS.plan,
    null
  );
  return { plan, setPlan, hydrated, clear };
}

// ============================== Custom meals library ==============================

export interface CustomMeal {
  id: string;
  name: string;
  source: "homemade" | "restaurant" | "other";
  station: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  diets: DietPreference[];
  allergens: Allergen[];
  notes?: string;
  createdAt: number;
}

interface CustomMealsState {
  meals: CustomMeal[];
}

const EMPTY_MEALS: CustomMealsState = { meals: [] };

export function useCustomMeals() {
  const [state, setState, hydrated, clear] = useStoredState<CustomMealsState>(
    STORAGE_KEYS.customMeals,
    EMPTY_MEALS
  );

  const add = useCallback(
    (meal: Omit<CustomMeal, "id" | "createdAt">) => {
      const id = `custom-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const full: CustomMeal = {
        ...meal,
        id,
        createdAt: Date.now(),
      };
      setState((prev) => {
        // Idempotent: StrictMode double-invokes setState updaters in dev.
        if (prev.meals.some((m) => m.id === full.id)) return prev;
        return { meals: [full, ...prev.meals] };
      });
      return full;
    },
    [setState]
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<CustomMeal, "id" | "createdAt">>) => {
      setState((prev) => ({
        meals: prev.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [setState]
  );

  const remove = useCallback(
    (id: string) => {
      setState((prev) => ({
        meals: prev.meals.filter((m) => m.id !== id),
      }));
    },
    [setState]
  );

  return { meals: state.meals, add, update, remove, hydrated, clear };
}

/** Convert a CustomMeal into a MenuItem-shaped record the optimizer / UI accepts. */
export function customMealToMenuItem(meal: CustomMeal) {
  return {
    recipeId: meal.id,
    name: meal.name,
    station: meal.station || (meal.source === "homemade" ? "Homemade" : "Restaurant"),
    allergens: meal.allergens,
    diets: meal.diets,
    nutrition: {
      servingSize: "1 serving",
      calories: meal.calories,
      totalFatG: meal.fatG,
      saturatedFatG: 0,
      transFatG: 0,
      cholesterolMg: 0,
      sodiumMg: 0,
      totalCarbsG: meal.carbsG,
      fiberG: meal.fiberG ?? 0,
      sugarG: 0,
      addedSugarG: 0,
      proteinG: meal.proteinG,
      calciumMg: 0,
      ironMg: 0,
      potassiumMg: 0,
      vitaminDMcg: 0,
    },
  };
}

// ============================== Revert history per meal ==============================

type SlotKey = `${number}-${"breakfast" | "lunch" | "dinner"}`;

interface HistoryState {
  /** Stack of previous MealSelections per slot. Latest pop reverts. */
  byslot: Record<SlotKey, MealSelection[]>;
}

const EMPTY_HISTORY: HistoryState = { byslot: {} };

export function useMealHistory() {
  const [state, setState, hydrated] = useStoredState<HistoryState>(
    STORAGE_KEYS.history,
    EMPTY_HISTORY
  );

  const push = useCallback(
    (slot: SlotKey, prev: MealSelection) => {
      // Tag the snapshot so StrictMode double-invocations dedupe.
      const stamp = `__t${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const tagged = { ...prev, __snapshotId: stamp } as MealSelection & {
        __snapshotId: string;
      };
      setState((s) => {
        const stack = s.byslot[slot] ?? [];
        const last = stack[stack.length - 1] as
          | (MealSelection & { __snapshotId?: string })
          | undefined;
        if (last && last.__snapshotId === stamp) return s;
        return {
          byslot: { ...s.byslot, [slot]: [...stack.slice(-4), tagged] },
        };
      });
    },
    [setState]
  );

  const pop = useCallback(
    (slot: SlotKey): MealSelection | null => {
      const stack = state.byslot[slot] ?? [];
      if (stack.length === 0) return null;
      const last = stack[stack.length - 1];
      setState((s) => {
        const remaining = (s.byslot[slot] ?? []).slice(0, -1);
        const next = { ...s.byslot };
        if (remaining.length === 0) {
          delete next[slot];
        } else {
          next[slot] = remaining;
        }
        return { byslot: next };
      });
      return last;
    },
    [setState, state]
  );

  const clear = useCallback(
    (slot?: SlotKey) => {
      setState((s) => {
        if (!slot) return EMPTY_HISTORY;
        const next = { ...s.byslot };
        delete next[slot];
        return { byslot: next };
      });
    },
    [setState]
  );

  const has = useCallback(
    (slot: SlotKey) => (state.byslot[slot]?.length ?? 0) > 0,
    [state]
  );

  return { push, pop, clear, has, hydrated };
}

// ============================== Eaten log ==============================

export interface EatenEntry {
  /** ISO date YYYY-MM-DD */
  date: string;
  period: "breakfast" | "lunch" | "dinner";
  /** What was actually eaten (free text + optional macros). */
  source: "planned" | "custom" | "estimate" | "skipped";
  label?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
  loggedAt: number;
}

interface EatenLogState {
  /** Keyed by `${date}-${period}` */
  entries: Record<string, EatenEntry>;
}

const EMPTY_LOG: EatenLogState = { entries: {} };

export function useEatenLog() {
  const [state, setState, hydrated, clear] = useStoredState<EatenLogState>(
    STORAGE_KEYS.eaten,
    EMPTY_LOG
  );

  const setEntry = useCallback(
    (entry: EatenEntry) => {
      const key = `${entry.date}-${entry.period}`;
      setState((prev) => ({
        entries: { ...prev.entries, [key]: entry },
      }));
    },
    [setState]
  );

  const removeEntry = useCallback(
    (date: string, period: EatenEntry["period"]) => {
      const key = `${date}-${period}`;
      setState((prev) => {
        const next = { ...prev.entries };
        delete next[key];
        return { entries: next };
      });
    },
    [setState]
  );

  const entriesForDate = useMemo(
    () =>
      (date: string): Record<string, EatenEntry> => {
        const out: Record<string, EatenEntry> = {};
        for (const [k, v] of Object.entries(state.entries)) {
          if (k.startsWith(`${date}-`)) out[k] = v;
        }
        return out;
      },
    [state]
  );

  return {
    entries: state.entries,
    setEntry,
    removeEntry,
    entriesForDate,
    hydrated,
    clear,
  };
}

// ============================== Helpers ==============================

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}
