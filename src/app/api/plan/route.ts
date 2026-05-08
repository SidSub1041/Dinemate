import { NextResponse } from "next/server";
import { z } from "zod";
import menuData from "@/data/menu.json";
import { calculateTargets } from "@/lib/nutrition";
import { buildPlan } from "@/lib/optimizer";
import type { MenuData, UserProfile } from "@/lib/types";

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
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile", details: parsed.error.format() },
      { status: 400 }
    );
  }
  const profile = parsed.data as UserProfile;
  const targets = calculateTargets(profile);
  const plan = buildPlan(menuData as MenuData, profile, targets, 7);
  return NextResponse.json(plan);
}
