export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very"
  | "extreme";

export type Goal = "cut" | "maintain" | "lean-bulk" | "bulk";

export type Allergen =
  | "egg"
  | "soy"
  | "wheat"
  | "milk"
  | "fish"
  | "shellfish"
  | "peanut"
  | "tree_nuts"
  | "sesame"
  | "gluten";

export type DietPreference =
  | "none"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "made_without_gluten";

export interface UserProfile {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  diet: DietPreference;
  avoidAllergens: Allergen[];
  proteinPerKg: number;
  fatPercent: number;
  /** Optional: when omitted, treat as all-three-meals-on-campus. */
  habits?: HabitProfile;
}

/**
 * How a student actually eats on campus. Drives what gets scheduled.
 */
export interface HabitProfile {
  /** Which meal periods to plan for. Empty = plan all three. */
  mealsOnCampus: ("breakfast" | "lunch" | "dinner")[];
  /** Rough weekly frequency: how many of those slots they actually use. */
  weeklyCampusMeals: "few" | "some" | "most" | "all";
}

export const DEFAULT_HABITS: HabitProfile = {
  mealsOnCampus: ["breakfast", "lunch", "dinner"],
  weeklyCampusMeals: "most",
};

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  bmr: number;
  tdee: number;
}

export interface NutritionFacts {
  servingSize: string;
  calories: number;
  totalFatG: number;
  saturatedFatG: number;
  transFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  totalCarbsG: number;
  fiberG: number;
  sugarG: number;
  addedSugarG: number;
  proteinG: number;
  calciumMg: number;
  ironMg: number;
  potassiumMg: number;
  vitaminDMcg: number;
}

export interface MenuItem {
  recipeId: string;
  name: string;
  station: string;
  allergens: Allergen[];
  diets: DietPreference[];
  nutrition?: NutritionFacts;
}

export type MealPeriod = "breakfast" | "lunch" | "late_lunch" | "dinner";

export interface Location {
  slug: string;
  name: string;
  meals: Record<MealPeriod, MenuItem[]>;
}

export interface MenuData {
  fetchedAt: string;
  date: string;
  locations: Location[];
}

export interface MealSelection {
  period: MealPeriod;
  location: string;
  items: MenuItem[];
  totals: NutritionFacts;
  /** Off-campus override — user is eating elsewhere for this slot. */
  external?: ExternalMeal;
  /** Pinned — preserved through rebuild_all and regenerate operations. */
  pinned?: boolean;
}

/**
 * An "off-campus" meal slot. If macros are provided they get subtracted from
 * the day's target so remaining campus meals still add up.
 */
export interface ExternalMeal {
  label?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

/**
 * Key used by client + optimizer to address a single day×period slot.
 */
export type MealSlotKey = `${number}-${"breakfast" | "lunch" | "dinner"}`;

export interface DailyPlan {
  day: string;
  meals: MealSelection[];
  totals: NutritionFacts;
  targetDelta: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

export interface PlanResult {
  targets: MacroTargets;
  days: DailyPlan[];
}
