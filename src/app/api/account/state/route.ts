import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  accountStateSchema,
  EMPTY_ACCOUNT_STATE,
  type AccountState,
} from "@/lib/account-state";

/**
 * GET /api/account/state
 *
 * Returns the canonical server-side snapshot for the signed-in user.
 * Shape matches what the localStorage layer expects — UI can swap one
 * for the other.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const userId = session.user.id;
  const [profile, plan, meals, eaten, ratings] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.plan.findUnique({ where: { userId } }),
    db.customMeal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.eatenEntry.findMany({ where: { userId } }),
    db.rating.findMany({ where: { userId } }),
  ]);

  const state: AccountState = {
    profile: profile
      ? {
          age: profile.age,
          sex: profile.sex as AccountState["profile"] extends infer P
            ? P extends { sex: infer S }
              ? S
              : never
            : never,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          activity:
            profile.activity as AccountState["profile"] extends infer P
              ? P extends { activity: infer A }
                ? A
                : never
              : never,
          goal: profile.goal as AccountState["profile"] extends infer P
            ? P extends { goal: infer G }
              ? G
              : never
            : never,
          diet: profile.diet as AccountState["profile"] extends infer P
            ? P extends { diet: infer D }
              ? D
              : never
            : never,
          avoidAllergens:
            profile.avoidAllergens as AccountState["profile"] extends infer P
              ? P extends { avoidAllergens: infer A }
                ? A
                : never
              : never,
          proteinPerKg: profile.proteinPerKg,
          fatPercent: profile.fatPercent,
          habits: profile.habits as AccountState["profile"] extends infer P
            ? P extends { habits?: infer H }
              ? H
              : undefined
            : undefined,
        }
      : null,
    plan: (plan?.data ?? null) as AccountState["plan"],
    customMeals: {
      meals: meals.map((m) => ({
        id: m.id,
        name: m.name,
        source: m.source as "homemade" | "restaurant" | "other",
        station: m.station,
        calories: m.calories,
        proteinG: m.proteinG,
        carbsG: m.carbsG,
        fatG: m.fatG,
        fiberG: m.fiberG ?? undefined,
        diets: m.diets,
        allergens: m.allergens,
        notes: m.notes ?? undefined,
        createdAt: m.createdAt.getTime(),
      })),
    },
    eaten: {
      entries: Object.fromEntries(
        eaten.map((e) => [
          `${e.date}-${e.period}`,
          {
            date: e.date,
            period: e.period as "breakfast" | "lunch" | "dinner",
            source: e.source as
              | "planned"
              | "custom"
              | "estimate"
              | "skipped",
            label: e.label ?? undefined,
            calories: e.calories ?? undefined,
            proteinG: e.proteinG ?? undefined,
            carbsG: e.carbsG ?? undefined,
            fatG: e.fatG ?? undefined,
            notes: e.notes ?? undefined,
            loggedAt: e.loggedAt.getTime(),
          },
        ])
      ),
    },
    ratings: {
      items: Object.fromEntries(
        ratings.map((r) => [r.recipeId, r.value as "love" | "hate"])
      ),
      updatedAt:
        ratings.reduce((m, r) => Math.max(m, r.createdAt.getTime()), 0) || 0,
    },
  };

  return NextResponse.json(state);
}

/**
 * PUT /api/account/state
 *
 * Replaces the server snapshot with the provided payload. Used by the
 * client-side sync engine after every local mutation.
 */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = accountStateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid state", details: parsed.error.format() },
      { status: 400 }
    );
  }
  const state = parsed.data;

  // Atomic-ish: do everything inside a single transaction so the snapshot
  // never has half-written tables.
  await db.$transaction(async (tx) => {
    // Profile: upsert or delete-if-null.
    if (state.profile) {
      await tx.profile.upsert({
        where: { userId },
        update: {
          age: state.profile.age,
          sex: state.profile.sex,
          heightCm: state.profile.heightCm,
          weightKg: state.profile.weightKg,
          activity: state.profile.activity,
          goal: state.profile.goal,
          diet: state.profile.diet,
          avoidAllergens: state.profile.avoidAllergens,
          proteinPerKg: state.profile.proteinPerKg,
          fatPercent: state.profile.fatPercent,
          habits: state.profile.habits ?? {},
        },
        create: {
          userId,
          age: state.profile.age,
          sex: state.profile.sex,
          heightCm: state.profile.heightCm,
          weightKg: state.profile.weightKg,
          activity: state.profile.activity,
          goal: state.profile.goal,
          diet: state.profile.diet,
          avoidAllergens: state.profile.avoidAllergens,
          proteinPerKg: state.profile.proteinPerKg,
          fatPercent: state.profile.fatPercent,
          habits: state.profile.habits ?? {},
        },
      });
    } else {
      await tx.profile
        .delete({ where: { userId } })
        .catch(() => undefined);
    }

    // Plan: upsert or delete-if-null.
    if (state.plan) {
      await tx.plan.upsert({
        where: { userId },
        update: { data: state.plan },
        create: { userId, data: state.plan },
      });
    } else {
      await tx.plan.delete({ where: { userId } }).catch(() => undefined);
    }

    // Custom meals: replace-all by id. Delete any rows not in payload, upsert the rest.
    const incomingIds = new Set(state.customMeals.meals.map((m) => m.id));
    const existingMeals = await tx.customMeal.findMany({
      where: { userId },
      select: { id: true },
    });
    const toDelete = existingMeals
      .filter((m) => !incomingIds.has(m.id))
      .map((m) => m.id);
    if (toDelete.length > 0) {
      await tx.customMeal.deleteMany({
        where: { userId, id: { in: toDelete } },
      });
    }
    for (const m of state.customMeals.meals) {
      await tx.customMeal.upsert({
        where: { id: m.id },
        update: {
          name: m.name,
          source: m.source,
          station: m.station,
          calories: m.calories,
          proteinG: m.proteinG,
          carbsG: m.carbsG,
          fatG: m.fatG,
          fiberG: m.fiberG ?? null,
          diets: m.diets,
          allergens: m.allergens,
          notes: m.notes ?? null,
        },
        create: {
          id: m.id,
          userId,
          name: m.name,
          source: m.source,
          station: m.station,
          calories: m.calories,
          proteinG: m.proteinG,
          carbsG: m.carbsG,
          fatG: m.fatG,
          fiberG: m.fiberG ?? null,
          diets: m.diets,
          allergens: m.allergens,
          notes: m.notes ?? null,
        },
      });
    }

    // Eaten entries: replace-all by (date,period).
    await tx.eatenEntry.deleteMany({ where: { userId } });
    const eatenRows = Object.values(state.eaten.entries);
    if (eatenRows.length > 0) {
      await tx.eatenEntry.createMany({
        data: eatenRows.map((e) => ({
          userId,
          date: e.date,
          period: e.period,
          source: e.source,
          label: e.label ?? null,
          calories: e.calories ?? null,
          proteinG: e.proteinG ?? null,
          carbsG: e.carbsG ?? null,
          fatG: e.fatG ?? null,
          notes: e.notes ?? null,
          loggedAt: new Date(e.loggedAt),
        })),
      });
    }

    // Ratings: replace-all by recipeId.
    await tx.rating.deleteMany({ where: { userId } });
    const ratingRows = Object.entries(state.ratings.items);
    if (ratingRows.length > 0) {
      await tx.rating.createMany({
        data: ratingRows.map(([recipeId, value]) => ({
          userId,
          recipeId,
          value,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}

/**
 * POST /api/account/state
 *
 * "Bootstrap" endpoint used immediately after sign-in. Server returns its
 * current state; if the server is empty AND the client provides a non-empty
 * payload, the client payload is upserted first and then echoed back.
 *
 * Conflict policy: server wins for returning users (server has more recent
 * cross-device data). Client wins for fresh accounts.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = EMPTY_ACCOUNT_STATE;
  }
  const parsed = accountStateSchema.safeParse(raw);
  const client = parsed.success ? parsed.data : EMPTY_ACCOUNT_STATE;

  // Check if the server has anything yet.
  const existingProfile = await db.profile.findUnique({ where: { userId } });
  const serverEmpty = !existingProfile;

  // If server is empty and client has data, upload client. Otherwise return server.
  if (serverEmpty && client.profile) {
    // Reuse the PUT path by inlining the same logic.
    const putReq = new Request(req.url, {
      method: "PUT",
      body: JSON.stringify(client),
      headers: { "Content-Type": "application/json" },
    });
    await PUT(putReq);
  }

  // Re-read server state to return the canonical snapshot.
  const get = await GET();
  return get;
}
