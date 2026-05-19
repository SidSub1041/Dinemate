import type {
  DailyPlan,
  ExternalMeal,
  MacroTargets,
  MealPeriod,
  MealSelection,
  MenuData,
  MenuItem,
  NutritionFacts,
  PlanResult,
  UserProfile,
} from "./types";

/** Plain rating map exchanged with the API. */
export type RatingMap = Record<string, "love" | "hate">;

/** Key shape `${dayIndex}-${period}` used by clients to address a slot. */
export type SlotKey = `${number}-${"breakfast" | "lunch" | "dinner"}`;

/** A meal the user has locked — preserve verbatim across rebuilds. */
export type PinnedMap = Record<SlotKey, MealSelection>;

/** A meal the user marked as eating elsewhere. */
export type ExternalMap = Record<SlotKey, ExternalMeal>;

export interface BuildOptions {
  ratings?: RatingMap;
  pinned?: PinnedMap;
  external?: ExternalMap;
}

interface ScoringContext {
  ratings: RatingMap;
  /** Station -> affinity in [-1, 1]. Computed from ratings. */
  stationAffinity: Map<string, number>;
}

/** Build a scoring context from raw ratings + the menu. */
function buildScoringContext(
  ratings: RatingMap,
  data: MenuData
): ScoringContext {
  const stationCounts = new Map<string, { love: number; hate: number }>();
  // Walk the menu so we know which station each rated recipe belongs to.
  for (const loc of data.locations) {
    for (const period of Object.keys(loc.meals) as MealPeriod[]) {
      for (const item of loc.meals[period]) {
        const rating = ratings[item.recipeId];
        if (!rating) continue;
        const cur = stationCounts.get(item.station) ?? { love: 0, hate: 0 };
        if (rating === "love") cur.love++;
        else cur.hate++;
        stationCounts.set(item.station, cur);
      }
    }
  }
  const stationAffinity = new Map<string, number>();
  for (const [station, { love, hate }] of stationCounts) {
    const total = love + hate;
    if (total === 0) continue;
    stationAffinity.set(station, (love - hate) / total);
  }
  return { ratings, stationAffinity };
}

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
  itemCount: number,
  itemList: ItemWithLocation[],
  ctx: ScoringContext
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

  // Preference bonuses: loved item = +120, station affinity = up to +60.
  let preferenceBonus = 0;
  for (const it of itemList) {
    if (ctx.ratings[it.recipeId] === "love") preferenceBonus += 120;
    const aff = ctx.stationAffinity.get(it.station);
    if (aff !== undefined) preferenceBonus += 60 * aff;
  }

  return (
    -(proteinShortfallPenalty + calPenalty + carbPenalty + fatPenalty + variety) +
    preferenceBonus
  );
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
  startIndex: number,
  ctx: ScoringContext
): BuiltMeal | null {
  const pool = candidates.filter((c) => !used.has(c.recipeId));
  if (!pool.length) return null;

  // Anchor pool: high-protein items, prioritizing loved items + station affinity.
  const anchorPool = pool
    .filter((c) => c.nutrition!.proteinG >= 8 || c.nutrition!.calories >= 150)
    .sort((a, b) => {
      const baseA = a.nutrition!.proteinG / Math.max(a.nutrition!.calories, 1);
      const baseB = b.nutrition!.proteinG / Math.max(b.nutrition!.calories, 1);
      const lovedA = ctx.ratings[a.recipeId] === "love" ? 1 : 0;
      const lovedB = ctx.ratings[b.recipeId] === "love" ? 1 : 0;
      const affA = ctx.stationAffinity.get(a.station) ?? 0;
      const affB = ctx.stationAffinity.get(b.station) ?? 0;
      // Loved > station affinity > protein/cal ratio.
      if (lovedA !== lovedB) return lovedB - lovedA;
      if (Math.abs(affA - affB) > 0.05) return affB - affA;
      return baseB - baseA;
    });

  if (anchorPool.length === 0) return null;
  const anchor = anchorPool[startIndex % anchorPool.length];
  const items: ItemWithLocation[] = [anchor];
  let totals = addNutrition(ZERO_NUTRITION, anchor.nutrition!);

  // Greedily add 1-3 more items that improve the score, no repeats.
  for (let i = 0; i < 3; i++) {
    const currentScore = scoreSelection(totals, target, items.length, items, ctx);
    let best: { item: ItemWithLocation; score: number; totals: NutritionFacts } | null = null;
    for (const c of pool) {
      if (items.some((it) => it.recipeId === c.recipeId)) continue;
      const newTotals = addNutrition(totals, c.nutrition!);
      // Hard cap: don't blow past 130% of target calories.
      if (newTotals.calories > target.calories * 1.3) continue;
      const newScore = scoreSelection(
        newTotals,
        target,
        items.length + 1,
        [...items, c],
        ctx
      );
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
    score: scoreSelection(totals, target, items.length, items, ctx),
  };
}

function buildMeal(
  data: MenuData,
  period: MealPeriod,
  target: MealTarget,
  profile: UserProfile,
  used: Set<string>,
  variantSeed: number,
  ctx: ScoringContext
): MealSelection {
  const all = flattenMenu(data, period)
    .filter(isPlausibleEntree)
    .filter((it) => passesDiet(it, profile))
    // Hate filter: never serve up an explicitly hated item.
    .filter((it) => ctx.ratings[it.recipeId] !== "hate");

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
    const built = buildMealForLocation(all, target, used, variantSeed + v, ctx);
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
  ratings: RatingMap = {},
  externalMacros: ExternalMeal | null = null,
  variantSeed: number = Math.floor(Math.random() * 1000)
): MealSelection {
  const target = adjustTargetForExternals(
    targetForMeal(period, targets),
    externalMacros ? [externalMacros] : []
  );
  const used = new Set<string>(excludeRecipeIds);
  const ctx = buildScoringContext(ratings, data);
  return buildMeal(data, period, target, profile, used, variantSeed, ctx);
}

/**
 * Subtract any provided external macros from a per-meal target so the
 * planner picks complementary items.
 */
function adjustTargetForExternals(
  target: MealTarget,
  externals: ExternalMeal[]
): MealTarget {
  let { calories, proteinG, carbsG, fatG } = target;
  for (const ext of externals) {
    if (ext.calories) calories = Math.max(0, calories - ext.calories);
    if (ext.proteinG) proteinG = Math.max(0, proteinG - ext.proteinG);
    if (ext.carbsG) carbsG = Math.max(0, carbsG - ext.carbsG);
    if (ext.fatG) fatG = Math.max(0, fatG - ext.fatG);
  }
  return { calories, proteinG, carbsG, fatG };
}

function externalToSelection(
  period: MealPeriod,
  ext: ExternalMeal
): MealSelection {
  const totals = {
    ...ZERO_NUTRITION,
    calories: ext.calories ?? 0,
    proteinG: ext.proteinG ?? 0,
    totalCarbsG: ext.carbsG ?? 0,
    totalFatG: ext.fatG ?? 0,
  };
  return {
    period,
    location: ext.label ?? "Off-campus",
    items: [],
    totals,
    external: ext,
  };
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
  days = 7,
  options: BuildOptions = {}
): PlanResult {
  const ratings = options.ratings ?? {};
  const pinned = options.pinned ?? {};
  const external = options.external ?? {};
  const ctx = buildScoringContext(ratings, data);

  // Which periods to actually plan, based on habit profile. We still
  // emit a MealSelection for every period each day (so the UI can show
  // empty slots), but unscheduled periods get a "skipped" marker.
  const habitMeals = new Set(
    profile.habits?.mealsOnCampus ?? ["breakfast", "lunch", "dinner"]
  );

  const result: DailyPlan[] = [];
  for (let day = 0; day < days; day++) {
    const used = new Set<string>();
    const meals: MealSelection[] = [];
    for (const period of ["breakfast", "lunch", "dinner"] as const) {
      const slotKey = `${day}-${period}` as SlotKey;

      // 1. Pinned: carry over verbatim and mark used so we don't repeat.
      const pin = pinned[slotKey];
      if (pin) {
        for (const it of pin.items) used.add(it.recipeId);
        meals.push({ ...pin, pinned: true });
        continue;
      }

      // 2. External: user is eating elsewhere — emit a synthetic selection.
      const ext = external[slotKey];
      if (ext) {
        meals.push(externalToSelection(period, ext));
        continue;
      }

      // 3. Outside habit profile: skip the slot.
      if (!habitMeals.has(period)) {
        meals.push({
          period,
          location: "—",
          items: [],
          totals: { ...ZERO_NUTRITION },
        });
        continue;
      }

      // 4. Default: optimizer picks. Subtract any same-day external macros.
      const sameDayExternals = (
        ["breakfast", "lunch", "dinner"] as const
      )
        .filter((p) => p !== period)
        .map((p) => external[`${day}-${p}` as SlotKey])
        .filter((m): m is ExternalMeal => !!m);
      const adjusted = adjustTargetForExternals(
        targetForMeal(period, targets),
        sameDayExternals
      );
      const sel = buildMeal(
        data,
        period,
        adjusted,
        profile,
        used,
        day * 7,
        ctx
      );
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
