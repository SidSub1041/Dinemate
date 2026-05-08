import * as cheerio from "cheerio";
import type { Element as DomElement } from "domhandler";
import type {
  Allergen,
  DietPreference,
  Location,
  MealPeriod,
  MenuData,
  MenuItem,
  NutritionFacts,
} from "./types";

const BASE = "https://dining.unc.edu";

const TAB_TO_PERIOD: Record<string, MealPeriod> = {
  "tabinfo-1": "breakfast",
  "tabinfo-2": "lunch",
  "tabinfo-3": "late_lunch",
  "tabinfo-4": "dinner",
};

export const ALL_YOU_CARE_LOCATIONS: { slug: string; name: string }[] = [
  { slug: "top-of-lenoir", name: "Top of Lenoir" },
  { slug: "chase", name: "Chase" },
];

const ALLERGEN_PATTERNS: { className: string; allergen: Allergen }[] = [
  { className: "allergen-has_egg", allergen: "egg" },
  { className: "allergen-has_soy", allergen: "soy" },
  { className: "allergen-has_wheat", allergen: "wheat" },
  { className: "allergen-has_milk", allergen: "milk" },
  { className: "allergen-has_fish", allergen: "fish" },
  { className: "allergen-has_shellfish", allergen: "shellfish" },
  { className: "allergen-has_peanut", allergen: "peanut" },
  { className: "allergen-has_tree_nuts", allergen: "tree_nuts" },
  { className: "allergen-has_sesame", allergen: "sesame" },
  { className: "allergen-has_gluten", allergen: "gluten" },
];

const DIET_PATTERNS: { className: string; diet: DietPreference }[] = [
  { className: "prop-vegetarian", diet: "vegetarian" },
  { className: "prop-vegan", diet: "vegan" },
  { className: "prop-halal", diet: "halal" },
  { className: "prop-made_without_gluten", diet: "made_without_gluten" },
];

function classListAttrs(
  el: DomElement,
  patterns: { className: string }[]
): string[] {
  const cls = el.attribs?.class ?? "";
  const tokens = cls.split(/\s+/);
  return patterns
    .filter((p) => tokens.includes(p.className))
    .map((p) => p.className);
}

export async function fetchLocation(
  slug: string,
  date: string,
  name: string
): Promise<Location> {
  const url = `${BASE}/locations/${slug}/?date=${date}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 UNC-Meal-Planner",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const meals: Record<MealPeriod, MenuItem[]> = {
    breakfast: [],
    lunch: [],
    late_lunch: [],
    dinner: [],
  };

  for (const [tabId, period] of Object.entries(TAB_TO_PERIOD)) {
    const tabPanel = $(`#${tabId}`);
    if (!tabPanel.length) continue;

    tabPanel.find(".menu-station").each((_, stationDiv) => {
      const $station = $(stationDiv);
      const station =
        $station.find("button.toggle-menu-station-data").first().text().trim() ||
        "Station";

      $station.find(".menu-item-li").each((__, li) => {
        const link = $(li).find("a.show-nutrition");
        if (!link.length) return;
        const recipeId = link.attr("data-recipe");
        if (!recipeId) return;

        const allergens = classListAttrs(link.get(0)!, ALLERGEN_PATTERNS).map(
          (cn) => ALLERGEN_PATTERNS.find((p) => p.className === cn)!.allergen
        );
        const diets = classListAttrs(link.get(0)!, DIET_PATTERNS).map(
          (cn) => DIET_PATTERNS.find((p) => p.className === cn)!.diet
        );

        meals[period].push({
          recipeId,
          name: link.text().trim(),
          station,
          allergens,
          diets,
        });
      });
    });
  }

  return { slug, name, meals };
}

function parseNumber(text: string): number {
  const m = text.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

export async function fetchNutrition(
  recipeId: string
): Promise<NutritionFacts | undefined> {
  const url = `${BASE}/wp-content/themes/nmc_dining/ajax-content/recipe.php?recipe=${recipeId}&hide_allergens=0`;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const json = (await res.json()) as { success: boolean; html: string };
  if (!json.success || !json.html) return undefined;

  const $ = cheerio.load(json.html);
  const facts: NutritionFacts = {
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

  const servingHeader = $("table.nutrition-facts-table thead th").first();
  if (servingHeader.length) {
    const text = servingHeader.text().replace(/\s+/g, " ").trim();
    const m = text.match(/Amount Per Serving\s+(.+)$/i);
    if (m) facts.servingSize = m[1].trim();
  }

  $("table.nutrition-facts-table tr").each((_, tr) => {
    const text = $(tr).text().replace(/\s+/g, " ").trim();
    if (/^Calories\b/i.test(text)) facts.calories = parseNumber(text);
    else if (/^Total Fat\b/i.test(text)) facts.totalFatG = parseNumber(text);
    else if (/^Saturated Fat\b/i.test(text))
      facts.saturatedFatG = parseNumber(text);
    else if (/^Trans Fat\b/i.test(text)) facts.transFatG = parseNumber(text);
    else if (/^Cholesterol\b/i.test(text))
      facts.cholesterolMg = parseNumber(text);
    else if (/^Sodium\b/i.test(text)) facts.sodiumMg = parseNumber(text);
    else if (/^Total Carbohydrate\b/i.test(text))
      facts.totalCarbsG = parseNumber(text);
    else if (/^Dietary Fiber\b/i.test(text)) facts.fiberG = parseNumber(text);
    else if (/^Sugars\b/i.test(text)) facts.sugarG = parseNumber(text);
    else if (/^Added Sugar\b/i.test(text))
      facts.addedSugarG = parseNumber(text);
    else if (/^Protein\b/i.test(text)) facts.proteinG = parseNumber(text);
    else if (/^Calcium\b/i.test(text)) facts.calciumMg = parseNumber(text);
    else if (/^Iron\b/i.test(text)) facts.ironMg = parseNumber(text);
    else if (/^Potassium\b/i.test(text))
      facts.potassiumMg = parseNumber(text);
    else if (/^Vitamin D\b/i.test(text))
      facts.vitaminDMcg = parseNumber(text);
  });

  return facts;
}

export async function scrapeMenuData(
  date: string,
  locations: { slug: string; name: string }[] = ALL_YOU_CARE_LOCATIONS,
  options: { concurrency?: number; onProgress?: (msg: string) => void } = {}
): Promise<MenuData> {
  const concurrency = options.concurrency ?? 8;
  const onProgress = options.onProgress ?? (() => {});

  onProgress(`Fetching ${locations.length} location pages for ${date}…`);
  const locs: Location[] = [];
  for (const loc of locations) {
    onProgress(`  • ${loc.name}`);
    const data = await fetchLocation(loc.slug, date, loc.name);
    locs.push(data);
  }

  const allItems = locs.flatMap((l) => Object.values(l.meals).flat());
  const uniqueIds = Array.from(new Set(allItems.map((i) => i.recipeId)));
  onProgress(
    `Resolving nutrition for ${uniqueIds.length} unique recipes (concurrency=${concurrency})…`
  );

  const nutritionMap = new Map<string, NutritionFacts | undefined>();
  let completed = 0;
  for (let i = 0; i < uniqueIds.length; i += concurrency) {
    const batch = uniqueIds.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          return [id, await fetchNutrition(id)] as const;
        } catch {
          return [id, undefined] as const;
        }
      })
    );
    for (const [id, n] of results) nutritionMap.set(id, n);
    completed += batch.length;
    if (completed % 40 === 0 || completed === uniqueIds.length) {
      onProgress(`    ${completed}/${uniqueIds.length} recipes resolved`);
    }
  }

  for (const loc of locs) {
    for (const period of Object.keys(loc.meals) as MealPeriod[]) {
      loc.meals[period] = loc.meals[period].map((item) => ({
        ...item,
        nutrition: nutritionMap.get(item.recipeId),
      }));
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    date,
    locations: locs,
  };
}
