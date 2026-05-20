import type { MealPlanTier, PaymentType } from "./types";

/**
 * Payment classification per dining location.
 *
 * Source: dining.unc.edu/how-to-use-your-meal-plan
 *   - Regular swipes work at the two all-you-care-to-eat halls plus
 *     Cafe 1789 (a Chase Hall venue counted as a swipe-eligible spot).
 *   - PLUS swipes work at retail outlets across campus.
 *   - Flex covers everything; we don't currently surface flex-only spots.
 *
 * The keys match the slugs we store on each Location.
 */
const PAYMENT_BY_SLUG: Record<string, PaymentType> = {
  "top-of-lenoir": "swipe",
  chase: "swipe",
  "cafe-1789": "swipe",
  // Retail / brand (all PLUS-eligible per CDS).
  "chick-fil-a": "plus",
  "bandidos-lenoir": "plus",
  "mediterranean-deli": "plus",
  "la-farm-bakery": "plus",
  bojangles: "plus",
  alpaca: "plus",
  subway: "plus",
  "italian-pizzeria-iii": "plus",
};

export function locationPaymentType(slug: string): PaymentType {
  return PAYMENT_BY_SLUG[slug] ?? "plus";
}

/** Static info we expose on the wizard's "meal plan" step. */
export const MEAL_PLAN_TIERS: {
  tier: MealPlanTier;
  label: string;
  description: string;
  weeklySwipes: number;
  weeklyPlusSwipes: number;
}[] = [
  // Numbers below are seasonal averages over a 14-week semester (the
  // semester swipe total ÷ 14). PLUS allowance is the explicit per-plan cap.
  {
    tier: "all-access",
    label: "All Access",
    description: "Unlimited regular swipes · 35 PLUS / semester",
    weeklySwipes: 21,
    weeklyPlusSwipes: 3,
  },
  {
    tier: "block-200",
    label: "Block 200",
    description: "~14 regular swipes/week · 35 PLUS / semester",
    weeklySwipes: 14,
    weeklyPlusSwipes: 3,
  },
  {
    tier: "block-160",
    label: "Block 160",
    description: "~11 regular swipes/week · 35 PLUS / semester",
    weeklySwipes: 11,
    weeklyPlusSwipes: 3,
  },
  {
    tier: "block-120",
    label: "Block 120",
    description: "~9 regular swipes/week · 35 PLUS / semester",
    weeklySwipes: 9,
    weeklyPlusSwipes: 3,
  },
  {
    tier: "block-100",
    label: "Block 100",
    description: "~7 regular swipes/week · 35 PLUS / semester",
    weeklySwipes: 7,
    weeklyPlusSwipes: 3,
  },
  {
    tier: "off-campus-50",
    label: "Off-Campus Block 50",
    description: "~3 regular / 25 PLUS for the semester",
    weeklySwipes: 3,
    weeklyPlusSwipes: 2,
  },
  {
    tier: "off-campus-35",
    label: "Off-Campus Block 35",
    description: "~2 regular / 25 PLUS for the semester",
    weeklySwipes: 2,
    weeklyPlusSwipes: 2,
  },
  {
    tier: "flex-only",
    label: "Flex-only",
    description: "No swipes — retail / dollars only",
    weeklySwipes: 0,
    weeklyPlusSwipes: 0,
  },
  {
    tier: "none",
    label: "No meal plan",
    description: "Off-campus — I don't have a CDS plan",
    weeklySwipes: 0,
    weeklyPlusSwipes: 0,
  },
];

/** Look up a tier definition by its identifier. */
export function getMealPlanTier(tier: MealPlanTier) {
  return MEAL_PLAN_TIERS.find((t) => t.tier === tier) ?? MEAL_PLAN_TIERS[0];
}

/**
 * Map a "HH:MM" time-of-day to which of our four dining periods it falls in.
 * Periods follow the dining.unc.edu schedule:
 *   breakfast: 7–11
 *   lunch:     11–3
 *   late_lunch: 3–5
 *   dinner:    5–8:30
 *
 * Returns "breakfast" by default for out-of-bounds inputs.
 */
export function periodForTime(
  time: string
): "breakfast" | "lunch" | "late_lunch" | "dinner" {
  const [hStr, mStr] = time.split(":");
  const minutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
  if (minutes < 11 * 60) return "breakfast";
  if (minutes < 15 * 60) return "lunch";
  if (minutes < 17 * 60) return "late_lunch";
  return "dinner";
}
