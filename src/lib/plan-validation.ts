/**
 * Detect plans that pre-date the "one location per meal" optimizer fix.
 *
 * The optimizer builds each meal entirely from a single location's items
 * so the displayed "Chick-fil-A" label actually reflects the items on the
 * card. Plans stored before that change can contain cross-location meals;
 * we detect them on load and trigger a silent rebuild.
 *
 * IMPORTANT: CDS reuses recipe ids across locations — roughly a third of
 * ids (174 of 595 in the Sep 2026 scrape) are served at BOTH Lenoir and
 * Chase. So the index must map each recipeId to the SET of locations that
 * serve it, and a meal counts as mixed only when NO single location serves
 * every item in it. The earlier single-slug (last-write-wins) index flagged
 * perfectly valid single-hall meals as mixed, which made the /plan
 * auto-heal rebuild users' plans on every visit and silently discard their
 * non-pinned swaps.
 */
import type { MenuData, PlanResult } from "./types";

export interface RecipeLocationIndex {
  /** recipeId -> every location slug that serves it (from menu.json). */
  bySlug: Map<string, Set<string>>;
}

export function buildRecipeLocationIndex(data: MenuData): RecipeLocationIndex {
  const bySlug = new Map<string, Set<string>>();
  for (const loc of data.locations) {
    for (const period of [
      "breakfast",
      "lunch",
      "late_lunch",
      "dinner",
    ] as const) {
      for (const it of loc.meals[period]) {
        const set = bySlug.get(it.recipeId);
        if (set) set.add(loc.slug);
        else bySlug.set(it.recipeId, new Set([loc.slug]));
      }
    }
  }
  return { bySlug };
}

/**
 * Returns true only if some non-external, non-pinned meal's items cannot
 * all have come from one location. Custom-meal items (recipeIds starting
 * with `custom-`) and ids no longer in the menu data are skipped: customs
 * live in user storage, and a rotated-out id says the plan is old, not
 * that it mixed locations.
 */
export function isPlanStale(
  plan: PlanResult,
  idx: RecipeLocationIndex
): boolean {
  for (const day of plan.days) {
    for (const meal of day.meals) {
      if (meal.external) continue;
      if (meal.pinned) continue;
      if (!meal.items.length) continue;

      let candidates: Set<string> | null = null;
      for (const it of meal.items) {
        if (it.recipeId.startsWith("custom-")) continue;
        const servedAt = idx.bySlug.get(it.recipeId);
        if (!servedAt) continue;
        if (candidates === null) {
          candidates = new Set(servedAt);
        } else {
          for (const slug of candidates) {
            if (!servedAt.has(slug)) candidates.delete(slug);
          }
        }
        // Intersection is empty: no single location serves all items.
        if (candidates.size === 0) return true;
      }
    }
  }
  return false;
}
