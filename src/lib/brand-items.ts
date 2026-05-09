/**
 * Curated nutrition data for non-scrapable on-campus restaurants.
 *
 * Source: each brand's public nutrition / allergen guide. Numbers are point-in-time
 * estimates and may not reflect current recipes — they're meant to give the optimizer
 * realistic options for spots like Chick-fil-A, Subway, Bojangles, etc., where
 * dining.unc.edu links out instead of publishing recipes itself.
 *
 * Keep entries to popular items only (3–8 per spot). The optimizer ignores anything
 * with calories < 60.
 */

import type {
  Allergen,
  DietPreference,
  Location,
  MealPeriod,
  MenuItem,
} from "./types";

interface BrandItem {
  name: string;
  station: string;
  calories: number;
  proteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  servingSize: string;
  allergens?: Allergen[];
  diets?: DietPreference[];
  /** Meal periods this item is realistically served during. */
  periods?: MealPeriod[];
}

interface BrandLocation {
  slug: string;
  name: string;
  campusLocation: string;
  defaultPeriods: MealPeriod[];
  items: BrandItem[];
}

const LUNCH_DINNER: MealPeriod[] = ["lunch", "late_lunch", "dinner"];
const ALL_DAY: MealPeriod[] = ["breakfast", "lunch", "late_lunch", "dinner"];

export const BRAND_LOCATIONS: BrandLocation[] = [
  // ---------- Bottom of Lenoir food court ----------
  {
    slug: "chick-fil-a",
    name: "Chick-fil-A",
    campusLocation: "Lenoir Hall",
    defaultPeriods: ALL_DAY,
    items: [
      {
        name: "Chicken Sandwich",
        station: "Sandwiches",
        calories: 420,
        proteinG: 28,
        totalCarbsG: 41,
        totalFatG: 17,
        fiberG: 1,
        sodiumMg: 1390,
        servingSize: "1 sandwich",
        allergens: ["wheat", "milk", "egg", "gluten"],
      },
      {
        name: "Grilled Chicken Sandwich",
        station: "Sandwiches",
        calories: 380,
        proteinG: 31,
        totalCarbsG: 44,
        totalFatG: 11,
        fiberG: 4,
        sodiumMg: 800,
        servingSize: "1 sandwich",
        allergens: ["wheat", "milk", "gluten"],
      },
      {
        name: "Spicy Chicken Sandwich",
        station: "Sandwiches",
        calories: 450,
        proteinG: 28,
        totalCarbsG: 42,
        totalFatG: 19,
        sodiumMg: 1620,
        servingSize: "1 sandwich",
        allergens: ["wheat", "milk", "egg", "gluten"],
      },
      {
        name: "Grilled Nuggets (8 ct)",
        station: "Nuggets",
        calories: 140,
        proteinG: 25,
        totalCarbsG: 1,
        totalFatG: 3,
        sodiumMg: 480,
        servingSize: "8 nuggets",
        allergens: ["milk"],
        diets: ["made_without_gluten"],
      },
      {
        name: "Chicken Nuggets (8 ct)",
        station: "Nuggets",
        calories: 250,
        proteinG: 27,
        totalCarbsG: 11,
        totalFatG: 11,
        sodiumMg: 1210,
        servingSize: "8 nuggets",
        allergens: ["wheat", "milk", "egg", "gluten"],
      },
      {
        name: "Cobb Salad with Grilled Chicken",
        station: "Salads",
        calories: 380,
        proteinG: 36,
        totalCarbsG: 19,
        totalFatG: 19,
        fiberG: 5,
        sodiumMg: 950,
        servingSize: "1 salad",
        allergens: ["milk", "egg"],
        diets: ["made_without_gluten"],
      },
      {
        name: "Waffle Fries (medium)",
        station: "Sides",
        calories: 360,
        proteinG: 4,
        totalCarbsG: 43,
        totalFatG: 19,
        sodiumMg: 230,
        servingSize: "medium",
        diets: ["vegetarian", "vegan", "made_without_gluten"],
      },
      {
        name: "Chicken Biscuit",
        station: "Breakfast",
        calories: 460,
        proteinG: 19,
        totalCarbsG: 44,
        totalFatG: 23,
        sodiumMg: 1330,
        servingSize: "1 biscuit",
        allergens: ["wheat", "milk", "egg", "gluten"],
        periods: ["breakfast"],
      },
    ],
  },
  {
    slug: "bandidos-lenoir",
    name: "Bandido's",
    campusLocation: "Lenoir Hall",
    defaultPeriods: LUNCH_DINNER,
    items: [
      {
        name: "Chicken Burrito Bowl",
        station: "Bowls",
        calories: 580,
        proteinG: 38,
        totalCarbsG: 62,
        totalFatG: 18,
        fiberG: 8,
        sodiumMg: 1320,
        servingSize: "1 bowl",
        diets: ["made_without_gluten"],
      },
      {
        name: "Steak Burrito",
        station: "Burritos",
        calories: 720,
        proteinG: 36,
        totalCarbsG: 78,
        totalFatG: 26,
        fiberG: 9,
        sodiumMg: 1610,
        servingSize: "1 burrito",
        allergens: ["wheat", "milk", "gluten"],
      },
      {
        name: "Veggie Burrito",
        station: "Burritos",
        calories: 580,
        proteinG: 17,
        totalCarbsG: 86,
        totalFatG: 18,
        fiberG: 14,
        sodiumMg: 1180,
        servingSize: "1 burrito",
        allergens: ["wheat", "milk", "gluten"],
        diets: ["vegetarian"],
      },
      {
        name: "Chicken Tacos (3)",
        station: "Tacos",
        calories: 540,
        proteinG: 32,
        totalCarbsG: 48,
        totalFatG: 22,
        fiberG: 6,
        sodiumMg: 1190,
        servingSize: "3 tacos",
        allergens: ["milk"],
      },
      {
        name: "Chicken Quesadilla",
        station: "Quesadillas",
        calories: 660,
        proteinG: 38,
        totalCarbsG: 50,
        totalFatG: 32,
        sodiumMg: 1410,
        servingSize: "1 quesadilla",
        allergens: ["wheat", "milk", "gluten"],
      },
    ],
  },
  {
    slug: "mediterranean-deli",
    name: "Mediterranean Deli",
    campusLocation: "Lenoir Hall",
    defaultPeriods: LUNCH_DINNER,
    items: [
      {
        name: "Chicken Shawarma Plate",
        station: "Plates",
        calories: 620,
        proteinG: 42,
        totalCarbsG: 65,
        totalFatG: 18,
        fiberG: 6,
        sodiumMg: 1140,
        servingSize: "1 plate",
        allergens: ["wheat", "gluten"],
      },
      {
        name: "Falafel Plate",
        station: "Plates",
        calories: 660,
        proteinG: 22,
        totalCarbsG: 88,
        totalFatG: 24,
        fiberG: 12,
        sodiumMg: 980,
        servingSize: "1 plate",
        allergens: ["wheat", "sesame", "gluten"],
        diets: ["vegetarian", "vegan"],
      },
      {
        name: "Gyro Wrap",
        station: "Wraps",
        calories: 540,
        proteinG: 30,
        totalCarbsG: 50,
        totalFatG: 22,
        fiberG: 4,
        sodiumMg: 1320,
        servingSize: "1 wrap",
        allergens: ["wheat", "milk", "gluten"],
      },
      {
        name: "Greek Salad with Grilled Chicken",
        station: "Salads",
        calories: 460,
        proteinG: 38,
        totalCarbsG: 18,
        totalFatG: 26,
        fiberG: 5,
        sodiumMg: 1080,
        servingSize: "1 salad",
        allergens: ["milk"],
        diets: ["made_without_gluten"],
      },
      {
        name: "Hummus & Pita",
        station: "Sides",
        calories: 380,
        proteinG: 12,
        totalCarbsG: 52,
        totalFatG: 14,
        fiberG: 7,
        sodiumMg: 720,
        servingSize: "1 serving",
        allergens: ["wheat", "sesame", "gluten"],
        diets: ["vegetarian", "vegan"],
      },
    ],
  },
  {
    slug: "la-farm-bakery",
    name: "La Farm Bakery",
    campusLocation: "Lenoir Hall",
    defaultPeriods: ["breakfast", "lunch", "late_lunch"],
    items: [
      {
        name: "Almond Croissant",
        station: "Bakery",
        calories: 480,
        proteinG: 9,
        totalCarbsG: 50,
        totalFatG: 26,
        sugarG: 22,
        sodiumMg: 380,
        servingSize: "1 croissant",
        allergens: ["wheat", "milk", "egg", "tree_nuts", "gluten"],
        diets: ["vegetarian"],
      },
      {
        name: "Turkey & Brie Baguette",
        station: "Sandwiches",
        calories: 620,
        proteinG: 32,
        totalCarbsG: 68,
        totalFatG: 22,
        fiberG: 4,
        sodiumMg: 1380,
        servingSize: "1 sandwich",
        allergens: ["wheat", "milk", "gluten"],
      },
      {
        name: "Caprese Sandwich",
        station: "Sandwiches",
        calories: 540,
        proteinG: 22,
        totalCarbsG: 62,
        totalFatG: 22,
        fiberG: 4,
        sodiumMg: 1020,
        servingSize: "1 sandwich",
        allergens: ["wheat", "milk", "gluten"],
        diets: ["vegetarian"],
      },
      {
        name: "Quiche Lorraine",
        station: "Bakery",
        calories: 420,
        proteinG: 18,
        totalCarbsG: 28,
        totalFatG: 26,
        sodiumMg: 720,
        servingSize: "1 slice",
        allergens: ["wheat", "milk", "egg", "gluten"],
      },
    ],
  },
  // ---------- Carolina Union ----------
  {
    slug: "bojangles",
    name: "Bojangles",
    campusLocation: "Carolina Union",
    defaultPeriods: ALL_DAY,
    items: [
      {
        name: "Cajun Filet Biscuit",
        station: "Sandwiches",
        calories: 590,
        proteinG: 23,
        totalCarbsG: 58,
        totalFatG: 30,
        sodiumMg: 1450,
        servingSize: "1 biscuit",
        allergens: ["wheat", "milk", "egg", "gluten"],
        periods: ["breakfast", "lunch"],
      },
      {
        name: "Sausage Biscuit",
        station: "Breakfast",
        calories: 530,
        proteinG: 13,
        totalCarbsG: 38,
        totalFatG: 36,
        sodiumMg: 1290,
        servingSize: "1 biscuit",
        allergens: ["wheat", "milk", "gluten"],
        periods: ["breakfast"],
      },
      {
        name: "8-piece Tailgate (mixed)",
        station: "Chicken",
        calories: 1820,
        proteinG: 138,
        totalCarbsG: 64,
        totalFatG: 116,
        sodiumMg: 4880,
        servingSize: "8 pieces (shareable)",
        allergens: ["wheat", "milk", "egg", "gluten"],
      },
      {
        name: "Chicken Supremes (4)",
        station: "Chicken",
        calories: 410,
        proteinG: 27,
        totalCarbsG: 32,
        totalFatG: 21,
        sodiumMg: 1280,
        servingSize: "4 supremes",
        allergens: ["wheat", "milk", "gluten"],
      },
      {
        name: "Dirty Rice",
        station: "Sides",
        calories: 170,
        proteinG: 5,
        totalCarbsG: 24,
        totalFatG: 6,
        fiberG: 1,
        sodiumMg: 510,
        servingSize: "1 side",
        allergens: ["wheat", "gluten"],
      },
      {
        name: "Cajun Pintos",
        station: "Sides",
        calories: 110,
        proteinG: 6,
        totalCarbsG: 18,
        totalFatG: 0,
        fiberG: 6,
        sodiumMg: 480,
        servingSize: "1 side",
        diets: ["vegetarian", "vegan", "made_without_gluten"],
      },
    ],
  },
  // ---------- Brinkhous-Bullitt / Davis area ----------
  {
    slug: "alpaca",
    name: "Alpaca Peruvian Chicken",
    campusLocation: "Brinkhous-Bullitt",
    defaultPeriods: LUNCH_DINNER,
    items: [
      {
        name: "Quarter Chicken with 2 Sides",
        station: "Plates",
        calories: 720,
        proteinG: 56,
        totalCarbsG: 50,
        totalFatG: 32,
        fiberG: 6,
        sodiumMg: 1380,
        servingSize: "1 plate",
        diets: ["made_without_gluten"],
      },
      {
        name: "Chicken Sandwich",
        station: "Sandwiches",
        calories: 540,
        proteinG: 38,
        totalCarbsG: 48,
        totalFatG: 20,
        sodiumMg: 1180,
        servingSize: "1 sandwich",
        allergens: ["wheat", "gluten"],
      },
      {
        name: "Chicken Salad",
        station: "Salads",
        calories: 420,
        proteinG: 38,
        totalCarbsG: 14,
        totalFatG: 22,
        fiberG: 5,
        sodiumMg: 980,
        servingSize: "1 salad",
        diets: ["made_without_gluten"],
      },
      {
        name: "Yuca Frita",
        station: "Sides",
        calories: 320,
        proteinG: 3,
        totalCarbsG: 42,
        totalFatG: 16,
        sodiumMg: 240,
        servingSize: "1 side",
        diets: ["vegetarian", "vegan", "made_without_gluten"],
      },
      {
        name: "Avocado Salad",
        station: "Sides",
        calories: 220,
        proteinG: 3,
        totalCarbsG: 14,
        totalFatG: 18,
        fiberG: 7,
        sodiumMg: 240,
        servingSize: "1 side",
        diets: ["vegetarian", "vegan", "made_without_gluten"],
      },
    ],
  },
  // ---------- Chase area ----------
  {
    slug: "subway",
    name: "Subway",
    campusLocation: "Chase Hall",
    defaultPeriods: ALL_DAY,
    items: [
      {
        name: "Turkey Breast 6\" on Wheat",
        station: "Subs",
        calories: 280,
        proteinG: 18,
        totalCarbsG: 44,
        totalFatG: 4,
        fiberG: 5,
        sodiumMg: 760,
        servingSize: "6 inch",
        allergens: ["wheat", "soy", "gluten"],
      },
      {
        name: "Rotisserie Chicken 6\" on Wheat",
        station: "Subs",
        calories: 350,
        proteinG: 28,
        totalCarbsG: 43,
        totalFatG: 8,
        fiberG: 5,
        sodiumMg: 600,
        servingSize: "6 inch",
        allergens: ["wheat", "soy", "gluten"],
      },
      {
        name: "Steak & Cheese 6\" on Wheat",
        station: "Subs",
        calories: 400,
        proteinG: 27,
        totalCarbsG: 45,
        totalFatG: 13,
        fiberG: 5,
        sodiumMg: 920,
        servingSize: "6 inch",
        allergens: ["wheat", "milk", "soy", "gluten"],
      },
      {
        name: "Veggie Delite 6\" on Wheat",
        station: "Subs",
        calories: 230,
        proteinG: 8,
        totalCarbsG: 44,
        totalFatG: 3,
        fiberG: 5,
        sodiumMg: 290,
        servingSize: "6 inch",
        allergens: ["wheat", "soy", "gluten"],
        diets: ["vegetarian"],
      },
      {
        name: "Tuna 6\" on Wheat",
        station: "Subs",
        calories: 470,
        proteinG: 19,
        totalCarbsG: 42,
        totalFatG: 25,
        fiberG: 5,
        sodiumMg: 580,
        servingSize: "6 inch",
        allergens: ["wheat", "fish", "egg", "soy", "gluten"],
      },
      {
        name: "Rotisserie Chicken Salad",
        station: "Salads",
        calories: 200,
        proteinG: 25,
        totalCarbsG: 11,
        totalFatG: 6,
        fiberG: 4,
        sodiumMg: 400,
        servingSize: "1 salad",
        diets: ["made_without_gluten"],
      },
    ],
  },
  // ---------- Kenan-Flagler / Davis-area pizzeria ----------
  {
    slug: "italian-pizzeria-iii",
    name: "Italian Pizzeria III",
    campusLocation: "Kenan-Flagler / Brinkhous-Bullitt",
    defaultPeriods: LUNCH_DINNER,
    items: [
      {
        name: "Cheese Pizza Slice",
        station: "Pizza",
        calories: 290,
        proteinG: 13,
        totalCarbsG: 36,
        totalFatG: 10,
        sodiumMg: 620,
        servingSize: "1 slice",
        allergens: ["wheat", "milk", "gluten"],
        diets: ["vegetarian"],
      },
      {
        name: "Pepperoni Pizza Slice",
        station: "Pizza",
        calories: 340,
        proteinG: 15,
        totalCarbsG: 36,
        totalFatG: 14,
        sodiumMg: 820,
        servingSize: "1 slice",
        allergens: ["wheat", "milk", "gluten"],
      },
      {
        name: "Chicken Parmesan Sub",
        station: "Subs",
        calories: 720,
        proteinG: 42,
        totalCarbsG: 70,
        totalFatG: 28,
        sodiumMg: 1620,
        servingSize: "1 sub",
        allergens: ["wheat", "milk", "egg", "gluten"],
      },
      {
        name: "Caesar Salad with Chicken",
        station: "Salads",
        calories: 480,
        proteinG: 36,
        totalCarbsG: 20,
        totalFatG: 28,
        fiberG: 4,
        sodiumMg: 980,
        servingSize: "1 salad",
        allergens: ["wheat", "milk", "egg", "fish", "gluten"],
      },
    ],
  },
];

const BRAND_RECIPE_PREFIX = "brand:";

function brandRecipeId(locSlug: string, itemIndex: number): string {
  return `${BRAND_RECIPE_PREFIX}${locSlug}:${itemIndex}`;
}

function toMenuItem(
  item: BrandItem,
  locSlug: string,
  itemIndex: number
): MenuItem {
  return {
    recipeId: brandRecipeId(locSlug, itemIndex),
    name: item.name,
    station: item.station,
    allergens: item.allergens ?? [],
    diets: item.diets ?? [],
    nutrition: {
      servingSize: item.servingSize,
      calories: item.calories,
      totalFatG: item.totalFatG,
      saturatedFatG: 0,
      transFatG: 0,
      cholesterolMg: 0,
      sodiumMg: item.sodiumMg ?? 0,
      totalCarbsG: item.totalCarbsG,
      fiberG: item.fiberG ?? 0,
      sugarG: item.sugarG ?? 0,
      addedSugarG: 0,
      proteinG: item.proteinG,
      calciumMg: 0,
      ironMg: 0,
      potassiumMg: 0,
      vitaminDMcg: 0,
    },
  };
}

/**
 * Convert each brand restaurant into a Location-shaped record so the optimizer
 * can treat them the same as scraped halls.
 */
export function brandLocations(): Location[] {
  return BRAND_LOCATIONS.map((loc) => {
    const meals: Record<MealPeriod, MenuItem[]> = {
      breakfast: [],
      lunch: [],
      late_lunch: [],
      dinner: [],
    };
    loc.items.forEach((item, idx) => {
      const periods = item.periods ?? loc.defaultPeriods;
      const menuItem = toMenuItem(item, loc.slug, idx);
      for (const p of periods) {
        meals[p].push(menuItem);
      }
    });
    return {
      slug: loc.slug,
      name: `${loc.name} (${loc.campusLocation})`,
      meals,
    };
  });
}
