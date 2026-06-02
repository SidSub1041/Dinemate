/**
 * Detect plans that pre-date the "one location per meal" optimizer fix.
 *
 * The optimizer was updated (commit 7ae740c) to build each meal entirely
 * from a single location's items so the displayed "Chick-fil-A" label
 * actually reflects the items on the card. Plans stored before that
 * change can still contain cross-location meals; the safest thing is to
 * detect them on load and trigger a silent rebuild so the user is never
 * staring at a mismatched label like:
 *
 *   Chick-fil-A
 *     - Market Salad          (Chick-fil-A)   ✓
 *     - Meatball Marinara Sub (Subway)        ✗
 */
import type { MenuData, PlanResult } from "./types";

export interface RecipeLocationIndex {
  /** recipeId -> location slug, derived from menu.json. */
  bySlug: Map<string, string>;
}

export function buildRecipeLocationIndex(data: MenuData): RecipeLocationIndex {
  const bySlug = new Map<string, string>();
  for (const loc of data.locations) {
    for (const period of [
      "breakfast",
      "lunch",
      "late_lunch",
      "dinner",
    ] as const) {
      for (const it of loc.meals[period]) {
        bySlug.set(it.recipeId, loc.slug);
      }
    }
  }
  return { bySlug };
}

/**
 * Returns true if any non-external, non-empty meal contains items from
 * more than one dining location. Custom-meal items (recipeIds starting
 * with `custom-`) and pinned meals are exempt: customs live in user
 * storage and pinned meals are user-chosen.
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
      const slugs = new Set<string>();
      for (const it of meal.items) {
        if (it.recipeId.startsWith("custom-")) continue;
        const slug = idx.bySlug.get(it.recipeId);
        if (slug) slugs.add(slug);
      }
      if (slugs.size > 1) return true;
    }
  }
  return false;
}
