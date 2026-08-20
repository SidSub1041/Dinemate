import { z } from "zod";

/**
 * Schemas for the full bundle of user-owned state that flows between
 * localStorage and the server. The schemas double as runtime validation
 * for the /api/account/state PUT body.
 */

const habitSchema = z
  .object({
    mealsOnCampus: z.array(z.enum(["breakfast", "lunch", "dinner"])),
    weeklyCampusMeals: z.enum(["few", "some", "most", "all"]),
  })
  .optional();

export const profileSchema = z.object({
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
});

export const customMealSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  source: z.enum(["homemade", "restaurant", "other"]),
  station: z.string().max(120).default(""),
  calories: z.number().int().min(0).max(5000),
  proteinG: z.number().int().min(0).max(300),
  carbsG: z.number().int().min(0).max(500),
  fatG: z.number().int().min(0).max(300),
  fiberG: z.number().int().min(0).max(200).optional(),
  diets: z.array(z.string()),
  allergens: z.array(z.string()),
  notes: z.string().max(2000).optional(),
  createdAt: z.number().int(),
});

export const eatenEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.enum(["breakfast", "lunch", "dinner"]),
  source: z.enum(["planned", "custom", "estimate", "skipped"]),
  label: z.string().max(200).optional(),
  calories: z.number().min(0).max(5000).optional(),
  proteinG: z.number().min(0).max(300).optional(),
  carbsG: z.number().min(0).max(500).optional(),
  fatG: z.number().min(0).max(300).optional(),
  notes: z.string().max(2000).optional(),
  loggedAt: z.number().int(),
});

export const ratingsSchema = z.record(
  z.string(),
  z.enum(["love", "hate"])
);

/**
 * Collection size caps.
 *
 * PUT /api/account/state writes every element of these collections inside
 * one transaction, so an unbounded payload from a single authenticated
 * caller turns into unbounded DB work (and a held transaction). These
 * ceilings sit far above any real user — a heavy user has tens of custom
 * meals and ~3 eaten entries per day — while capping the blast radius.
 */
export const MAX_CUSTOM_MEALS = 500;
export const MAX_EATEN_ENTRIES = 3000; // ~3/day for ~3 years
export const MAX_RATINGS = 5000;

const boundedRecord = <T extends z.ZodTypeAny>(
  schema: T,
  max: number,
  label: string
) =>
  z
    .record(z.string(), schema)
    .refine((r) => Object.keys(r).length <= max, {
      message: `Too many ${label} (max ${max}).`,
    });

export const accountStateSchema = z.object({
  profile: profileSchema.nullable(),
  plan: z.any().nullable(),
  customMeals: z.object({
    meals: z.array(customMealSchema).max(MAX_CUSTOM_MEALS),
  }),
  eaten: z.object({
    entries: boundedRecord(eatenEntrySchema, MAX_EATEN_ENTRIES, "eaten entries"),
  }),
  ratings: z.object({
    items: boundedRecord(
      z.enum(["love", "hate"]),
      MAX_RATINGS,
      "ratings"
    ),
    updatedAt: z.number().int(),
  }),
});

export type AccountState = z.infer<typeof accountStateSchema>;

export const EMPTY_ACCOUNT_STATE: AccountState = {
  profile: null,
  plan: null,
  customMeals: { meals: [] },
  eaten: { entries: {} },
  ratings: { items: {}, updatedAt: 0 },
};
