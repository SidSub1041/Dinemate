import { NextResponse } from "next/server";
import menuData from "@/data/menu.json";
import {
  calculateTargets,
  defaultFatPercent,
  defaultProteinPerKg,
} from "@/lib/nutrition";
import { buildPlan } from "@/lib/optimizer";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import type { MenuData, UserProfile } from "@/lib/types";

/**
 * Public teaser endpoint for signed-out visitors.
 *
 * Two things make this safe to expose without auth:
 *
 *  1. The profile is fixed server-side. The request body is ignored
 *     entirely, so this can't be driven as a free compute oracle with
 *     arbitrary inputs.
 *  2. Only ONE day is generated and returned. The previous implementation
 *     asked /api/plan for all seven days and hid days 2-7 in the client,
 *     which meant the full week was sitting in the network response for
 *     anyone who opened devtools. Truncation now happens on the server.
 */

const DEMO_PROFILE: UserProfile = {
  age: 20,
  sex: "male",
  heightCm: 177.8, // 5'10"
  weightKg: 72.5748, // 160 lb
  activity: "moderate",
  goal: "maintain",
  diet: "none",
  avoidAllergens: [],
  proteinPerKg: defaultProteinPerKg("maintain"),
  fatPercent: defaultFatPercent("maintain"),
};

export async function POST(req: Request) {
  const limited = rateLimit(`preview:${clientIp(req)}`, 20, 10 * 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  const targets = calculateTargets(DEMO_PROFILE);
  // days = 1: the teaser is a single sample day, enforced server-side.
  const plan = buildPlan(menuData as MenuData, DEMO_PROFILE, targets, 1, {
    ratings: {},
  });
  return NextResponse.json(plan);
}
