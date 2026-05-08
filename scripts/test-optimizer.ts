import { calculateTargets, defaultFatPercent, defaultProteinPerKg, lbToKg, ftInToCm } from "../src/lib/nutrition";
import { buildPlan } from "../src/lib/optimizer";
import menuData from "../src/data/menu.json";
import type { MenuData, UserProfile } from "../src/lib/types";

const profile: UserProfile = {
  age: 22,
  sex: "male",
  heightCm: ftInToCm(5, 11),
  weightKg: lbToKg(170),
  activity: "moderate",
  goal: "lean-bulk",
  diet: "none",
  avoidAllergens: [],
  proteinPerKg: defaultProteinPerKg("lean-bulk"),
  fatPercent: defaultFatPercent("lean-bulk"),
};

const targets = calculateTargets(profile);
console.log("Targets:", targets);

const plan = buildPlan(menuData as MenuData, profile, targets, 3);
for (const day of plan.days) {
  console.log(`\n=== ${day.day} ===`);
  console.log(`Day totals: ${Math.round(day.totals.calories)}cal | P${Math.round(day.totals.proteinG)}g C${Math.round(day.totals.totalCarbsG)}g F${Math.round(day.totals.totalFatG)}g`);
  console.log(`Delta: ${day.targetDelta.calories>0?'+':''}${Math.round(day.targetDelta.calories)}cal, ${day.targetDelta.proteinG>0?'+':''}${Math.round(day.targetDelta.proteinG)}g protein`);
  for (const m of day.meals) {
    console.log(`  [${m.period}] @ ${m.location} — ${Math.round(m.totals.calories)}cal, ${Math.round(m.totals.proteinG)}g P`);
    for (const it of m.items) {
      console.log(`    • ${it.name} (${it.station}) ${it.nutrition?.calories}cal ${it.nutrition?.proteinG}gP`);
    }
  }
}
