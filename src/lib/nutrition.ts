import type {
  ActivityLevel,
  Goal,
  MacroTargets,
  Sex,
  UserProfile,
} from "./types";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

const GOAL_DELTA: Record<Goal, number> = {
  cut: -500,
  maintain: 0,
  "lean-bulk": 250,
  bulk: 500,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Lightly active (1–3 workouts/week)",
  moderate: "Moderately active (3–5 workouts/week)",
  very: "Very active (6–7 hard workouts/week)",
  extreme: "Athlete (twice-daily training)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  cut: "Cut (lose ~1 lb/week)",
  maintain: "Maintain current weight",
  "lean-bulk": "Lean bulk (~0.5 lb/week)",
  bulk: "Bulk (~1 lb/week)",
};

export function mifflinStJeor(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTargets(profile: UserProfile): MacroTargets {
  const bmr = mifflinStJeor(
    profile.sex,
    profile.weightKg,
    profile.heightCm,
    profile.age
  );
  const tdee = bmr * ACTIVITY_MULTIPLIER[profile.activity];
  const calories = Math.max(1200, tdee + GOAL_DELTA[profile.goal]);

  const proteinG = profile.weightKg * profile.proteinPerKg;
  const fatCalories = calories * profile.fatPercent;
  const fatG = fatCalories / 9;

  const proteinCalories = proteinG * 4;
  const remainingCalories = Math.max(
    0,
    calories - proteinCalories - fatCalories
  );
  const carbsG = remainingCalories / 4;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
  };
}

export function defaultProteinPerKg(goal: Goal): number {
  switch (goal) {
    case "cut":
      return 2.2;
    case "maintain":
      return 1.8;
    case "lean-bulk":
      return 2.0;
    case "bulk":
      return 1.8;
  }
}

export function defaultFatPercent(goal: Goal): number {
  return goal === "cut" ? 0.25 : 0.3;
}

export function lbToKg(lb: number): number {
  return lb * 0.453592;
}

export function ftInToCm(ft: number, inches: number): number {
  return (ft * 12 + inches) * 2.54;
}

export function kgToLb(kg: number): number {
  return kg / 0.453592;
}

export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - ft * 12);
  return { ft, inches };
}
