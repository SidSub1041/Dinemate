import { NextResponse } from "next/server";
import { z } from "zod";
import menuData from "@/data/menu.json";
import { calculateTargets } from "@/lib/nutrition";
import { buildPlan, type PinnedMap } from "@/lib/optimizer";
import type { MenuData, UserProfile } from "@/lib/types";

const habitSchema = z
  .object({
    mealsOnCampus: z
      .array(z.enum(["breakfast", "lunch", "dinner"]))
      .default(["breakfast", "lunch", "dinner"]),
    weeklyCampusMeals: z
      .enum(["few", "some", "most", "all"])
      .default("most"),
  })
  .optional();

const profileSchema = z.object({
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
  habits: habitSchema,
});

const externalMealSchema = z.object({
  label: z.string().max(120).optional(),
  calories: z.number().min(0).max(3000).optional(),
  proteinG: z.number().min(0).max(300).optional(),
  carbsG: z.number().min(0).max(500).optional(),
  fatG: z.number().min(0).max(300).optional(),
});

const slotKeyRegex = /^\d+-(breakfast|lunch|dinner)$/;

const requestSchema = z.union([
  // Old shape: just the profile (backwards compatibility).
  profileSchema,
  // New shape: profile + ratings + pinned + external.
  z.object({
    profile: profileSchema,
    ratings: z.record(z.string(), z.enum(["love", "hate"])).default({}),
    pinned: z
      .record(z.string().regex(slotKeyRegex), z.any())
      .default({}),
    external: z
      .record(z.string().regex(slotKeyRegex), externalMealSchema)
      .default({}),
  }),
]);

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.format() },
      { status: 400 }
    );
  }
  const profile = ("profile" in parsed.data
    ? parsed.data.profile
    : parsed.data) as UserProfile;
  const ratings = "ratings" in parsed.data ? parsed.data.ratings : {};
  const pinned = "pinned" in parsed.data ? parsed.data.pinned : {};
  const external = "external" in parsed.data ? parsed.data.external : {};
  const targets = calculateTargets(profile);
  const plan = buildPlan(menuData as MenuData, profile, targets, 7, {
    ratings,
    // Casting: pinned items came through z.any() since they're full
    // MealSelection shapes; the optimizer trusts whatever the client stored.
    pinned: pinned as PinnedMap,
    external,
  });
  return NextResponse.json(plan);
}
