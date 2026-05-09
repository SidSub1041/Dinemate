import type {
  DailyPlan,
  MacroTargets,
  MealPeriod,
  MealSelection,
  MenuData,
  MenuItem,
  NutritionFacts,
  PlanResult,
  UserProfile,
} from "./types";

const ZERO_NUTRITION: NutritionFacts = {
  servingSize: "",
  calories: 0,
  totalFatG: 0,
  saturatedFatG: 0,
  transFatG: 0,
  cholesterolMg: 0,
  sodiumMg: 0,
  totalCarbsG: 0,
  fiberG: 0,
  sugarG: 0,
  addedSugarG: 0,
  proteinG: 0,
  calciumMg: 0,
  ironMg: 0,
  potassiumMg: 0,
  vitaminDMcg: 0,
};

function addNutrition(a: NutritionFacts, b: NutritionFacts): NutritionFacts {
  return {
    servingSize: "",
    calories: a.calories + b.calories,
    totalFatG: a.totalFatG + b.totalFatG,
    saturatedFatG: a.saturatedFatG + b.saturatedFatG,
    transFatG: a.transFatG + b.transFatG,
    cholesterolMg: a.cholesterolMg + b.cholesterolMg,
    sodiumMg: a.sodiumMg + b.sodiumMg,
    totalCarbsG: a.totalCarbsG + b.totalCarbsG,
    fiberG: a.fiberG + b.fiberG,
    sugarG: a.sugarG + b.sugarG,
    addedSugarG: a.addedSugarG + b.addedSugarG,
    proteinG: a.proteinG + b.proteinG,
    calciumMg: a.calciumMg + b.calciumMg,
    ironMg: a.ironMg + b.ironMg,
    potassiumMg: a.potassiumMg + b.potassiumMg,
    vitaminDMcg: a.vitaminDMcg + b.vitaminDMcg,
  };
}

const STATION_BLOCKLIST = new Set(
  [
    "Beverages",
    "Condiments",
    "Cereal",
    "Stress Less Cabinet",
    "Salad Bar",
    "Salad Bar Soups & Bakery",
  ].map((s) => s.toLowerCase())
);

const NAME_BLOCKLIST_PATTERNS = [
  /^water\b/i,
  /^ice\b/i,
  /\bsyrup\b/i,
  /\bcompote\b/i,
  /\bdressing\b/i,
  /\bsauce\b/i,
  /\bmustard\b/i,
  /\bketchup\b/i,
  /\bmayo\b/i,
  /\bbutter\b/i,
  /\bcream cheese\b/i,
  /\bsalt\b/i,
  /\bpepper\b/i,
  /\btopping\b/i,
  /\bmilk\b/i,
  /\bcoffee\b/i,
  /\btea\b/i,
  /\bjuice\b/i,
  /\bsoda\b/i,
  /\bsprite\b/i,
  /\bcoke\b/i,
  /\bpepsi\b/i,
  /\bjelly\b/i,
  /\bjam\b/i,
  /\bhoney\b/i,
  /\bsour cream\b/i,
  /\bsalsa\b/i,
  /\bguacamole\b/i,
  /\bhummus\b/i,
  /^sliced\s+(onion|tomato|cucumber|pepper|jalapeno|olive|mushroom|red onion|pickle)/i,
  /^chopped\s+/i,
  /^diced\s+/i,
  /^shredded\s+(lettuce|cabbage|cheese)/i,
  /\bcompostable\b/i,
  /\bnapkin\b/i,
  /\bcondiment\b/i,
];

function isPlausibleEntree(item: MenuItem): boolean {
  if (!item.nutrition) return false;
  const cal = item.nutrition.calories;
  if (cal < 60) return false; // Skip tiny garnish/topping portions.
  const station = item.station.toLowerCase();
  if (STATION_BLOCKLIST.has(station)) return false;
  if (NAME_BLOCKLIST_PATTERNS.some((rx) => rx.test(item.name))) return false;
  return true;
}

function passesDiet(item: MenuItem, profile: UserProfile): boolean {
  if (profile.diet !== "none") {
    if (profile.diet === "vegan" && !item.diets.includes("vegan")) return false;
    if (
      profile.diet === "vegetarian" &&
      !item.diets.includes("vegetarian") &&
      !item.diets.includes("vegan")
    )
      return false;
    if (profile.diet === "halal" && !item.diets.includes("halal")) return false;
    if (
      profile.diet === "made_without_gluten" &&
      !item.diets.includes("made_without_gluten")
    )
      return false;
  }
  for (const a of profile.avoidAllergens) {
    if (item.allergens.includes(a)) return false;
  }
  return true;
}

interface ItemWithLocation extends MenuItem {
  locationName: string;
}

function flattenMenu(
  data: MenuData,
  period: MealPeriod
): ItemWithLocation[] {
  return data.locations.flatMap((loc) =>
    loc.meals[period].map((it) => ({ ...it, locationName: loc.name }))
  );
}

interface MealTarget {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function scoreSelection(
  totals: NutritionFacts,
  target: MealTarget,
  itemCount: number
): number {
  const calDelta = Math.abs(totals.calories - target.calories);
  const protDelta = Math.abs(totals.proteinG - target.proteinG);
  const carbDelta = Math.abs(totals.totalCarbsG - target.carbsG);
  const fatDelta = Math.abs(totals.totalFatG - target.fatG);

  // Strong penalty for protein shortfall, moderate for cal, light for carbs/fat.
  const proteinShortfallPenalty =
    totals.proteinG < target.proteinG
      ? (target.proteinG - totals.proteinG) * 4
      : protDelta * 1.2;
  const calPenalty = calDelta * 0.6;
  const carbPenalty = carbDelta * 0.4;
  const fatPenalty = fatDelta * 0.5;
  const variety = itemCount >= 2 && itemCount <= 4 ? 0 : 30;

  return -(proteinShortfallPenalty + calPenalty + carbPenalty + fatPenalty + variety);
}

interface BuiltMeal {
  items: ItemWithLocation[];
  totals: NutritionFacts;
  location: string;
  score: number;
}

function buildMealForLocation(
  candidates: ItemWithLocation[],
  target: MealTarget,
  used: Set<string>,
  startIndex: number
): BuiltMeal | null {
  const pool = candidates.filter((c) => !used.has(c.recipeId));
  if (!pool.length) return null;

  // Pick a high-protein anchor with good protein/cal ratio (avoid pure-fat blocks).
  const anchorPool = pool
    .filter((c) => c.nutrition!.proteinG >= 8 || c.nutrition!.calories >= 150)
    .sort(
      (a, b) =>
        b.nutrition!.proteinG / Math.max(b.nutrition!.calories, 1) -
        a.nutrition!.proteinG / Math.max(a.nutrition!.calories, 1)
    );

  if (anchorPool.length === 0) return null;
  const anchor = anchorPool[startIndex % anchorPool.length];
  const items: ItemWithLocation[] = [anchor];
  let totals = addNutrition(ZERO_NUTRITION, anchor.nutrition!);

  // Greedily add 1-3 more items that improve the score, no repeats.
  for (let i = 0; i < 3; i++) {
    const currentScore = scoreSelection(totals, target, items.length);
    let best: { item: ItemWithLocation; score: number; totals: NutritionFacts } | null = null;
    for (const c of pool) {
      if (items.some((it) => it.recipeId === c.recipeId)) continue;
      const newTotals = addNutrition(totals, c.nutrition!);
      // Hard cap: don't blow past 130% of target calories.
      if (newTotals.calories > target.calories * 1.3) continue;
      const newScore = scoreSelection(newTotals, target, items.length + 1);
      if (newScore > currentScore && (!best || newScore > best.score)) {
        best = { item: c, score: newScore, totals: newTotals };
      }
    }
    if (!best) break;
    items.push(best.item);
    totals = best.totals;
  }

  return {
    items,
    totals,
    location: anchor.locationName,
    score: scoreSelection(totals, target, items.length),
  };
}

function buildMeal(
  data: MenuData,
  period: MealPeriod,
  target: MealTarget,
  profile: UserProfile,
  used: Set<string>,
  variantSeed: number
): MealSelection {
  const all = flattenMenu(data, period)
    .filter(isPlausibleEntree)
    .filter((it) => passesDiet(it, profile));

  if (all.length === 0) {
    return {
      period,
      location: "—",
      items: [],
      totals: { ...ZERO_NUTRITION },
    };
  }

  // Try multiple anchor variants to diversify days and pick the best.
  const candidates: BuiltMeal[] = [];
  for (let v = 0; v < 6; v++) {
    const built = buildMealForLocation(all, target, used, variantSeed + v);
    if (built) candidates.push(built);
  }
  if (candidates.length === 0) {
    return {
      period,
      location: "—",
      items: [],
      totals: { ...ZERO_NUTRITION },
    };
  }
  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0];
  for (const it of winner.items) used.add(it.recipeId);

  return {
    period,
    location: winner.location,
    items: winner.items,
    totals: winner.totals,
  };
}

/**
 * Build a single meal selection for the given period, excluding any item recipe
 * IDs the caller has already shown. Used by /api/regenerate-meal so the user can
 * cycle through alternative options without rebuilding the entire week.
 */
export function buildSingleMeal(
  data: MenuData,
  profile: UserProfile,
  targets: MacroTargets,
  period: "breakfast" | "lunch" | "dinner",
  excludeRecipeIds: string[],
  variantSeed: number = Math.floor(Math.random() * 1000)
): MealSelection {
  const target = targetForMeal(period, targets);
  const used = new Set<string>(excludeRecipeIds);
  return buildMeal(data, period, target, profile, used, variantSeed);
}

const MEAL_SPLIT: Record<"breakfast" | "lunch" | "dinner", number> = {
  breakfast: 0.27,
  lunch: 0.36,
  dinner: 0.37,
};

function targetForMeal(
  meal: keyof typeof MEAL_SPLIT,
  daily: MacroTargets
): MealTarget {
  const fraction = MEAL_SPLIT[meal];
  return {
    calories: daily.calories * fraction,
    proteinG: daily.proteinG * fraction,
    carbsG: daily.carbsG * fraction,
    fatG: daily.fatG * fraction,
  };
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function buildPlan(
  data: MenuData,
  profile: UserProfile,
  targets: MacroTargets,
  days = 7
): PlanResult {
  const result: DailyPlan[] = [];
  for (let day = 0; day < days; day++) {
    const used = new Set<string>();
    const meals: MealSelection[] = [];
    for (const period of ["breakfast", "lunch", "dinner"] as const) {
      const target = targetForMeal(period, targets);
      const sel = buildMeal(data, period, target, profile, used, day * 7);
      meals.push(sel);
    }
    let dayTotals = { ...ZERO_NUTRITION };
    for (const m of meals) dayTotals = addNutrition(dayTotals, m.totals);
    result.push({
      day: DAY_NAMES[day % 7],
      meals,
      totals: dayTotals,
      targetDelta: {
        calories: dayTotals.calories - targets.calories,
        proteinG: dayTotals.proteinG - targets.proteinG,
        carbsG: dayTotals.totalCarbsG - targets.carbsG,
        fatG: dayTotals.totalFatG - targets.fatG,
      },
    });
  }
  return { targets, days: result };
}
