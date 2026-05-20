import { NextResponse } from "next/server";
import { z } from "zod";
import menuData from "@/data/menu.json";
import { calculateTargets } from "@/lib/nutrition";
import { buildSingleMeal } from "@/lib/optimizer";
import type { MenuData, UserProfile } from "@/lib/types";

const schema = z.object({
  profile: z.object({
    age: z.number().int().min(14).max(100),
    sex: z.enum(["male", "female"]),
    heightCm: z.number().min(120).max(230),
    weightKg: z.number().min(30).max(250),
    activity: z.enum(["sedentary", "light", "moderate", "very", "extreme"]),
    goal: z.enum(["cut", "maintain", "lean-bulk", "bulk"]),
    diet: z.enum([
      "none",
      "vegetarian",
      "vegan",
      "halal",
      "made_without_gluten",
    ]),
    avoidAllergens: z.array(
      z.enum([
        "egg",
        "soy",
        "wheat",
        "milk",
        "fish",
        "shellfish",
        "peanut",
        "tree_nuts",
        "sesame",
        "gluten",
      ])
    ),
    proteinPerKg: z.number().min(0.8).max(3.5),
    fatPercent: z.number().min(0.15).max(0.5),
    habits: z
      .object({
        mealsOnCampus: z
          .array(z.enum(["breakfast", "lunch", "dinner"]))
          .default(["breakfast", "lunch", "dinner"]),
        weeklyCampusMeals: z
          .enum(["few", "some", "most", "all"])
          .default("most"),
      })
      .optional(),
    schedule: z
      .object({
        wakeTime: z.string().regex(/^\d{2}:\d{2}$/),
        sleepTime: z.string().regex(/^\d{2}:\d{2}$/),
        breakfastAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        lunchAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        dinnerAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
      .optional(),
    mealPlan: z
      .object({
        tier: z.enum([
          "all-access",
          "block-200",
          "block-160",
          "block-120",
          "block-100",
          "off-campus-50",
          "off-campus-35",
          "flex-only",
          "none",
        ]),
        weeklySwipes: z.number().int().min(0).max(50),
        weeklyPlusSwipes: z.number().int().min(0).max(20),
      })
      .optional(),
  }),
  period: z.enum(["breakfast", "lunch", "dinner"]),
  excludeRecipeIds: z.array(z.string()).max(200).default([]),
  ratings: z.record(z.string(), z.enum(["love", "hate"])).default({}),
  externalSameDay: z
    .object({
      label: z.string().max(120).optional(),
      calories: z.number().min(0).max(3000).optional(),
      proteinG: z.number().min(0).max(300).optional(),
      carbsG: z.number().min(0).max(500).optional(),
      fatG: z.number().min(0).max(300).optional(),
    })
    .nullable()
    .default(null),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.format() },
      { status: 400 }
    );
  }
  const { profile, period, excludeRecipeIds, ratings, externalSameDay } =
    parsed.data;
  const targets = calculateTargets(profile as UserProfile);
  const meal = buildSingleMeal(
    menuData as MenuData,
    profile as UserProfile,
    targets,
    period,
    excludeRecipeIds,
    ratings,
    externalSameDay
  );
  return NextResponse.json({ meal });
}
