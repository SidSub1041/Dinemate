"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleSlash2, NotebookPen, X } from "lucide-react";
import {
  useProfile,
  useStoredPlan,
  useEatenLog,
  useCustomMeals,
  todayISO,
  type EatenEntry,
  type CustomMeal,
} from "@/lib/use-app-data";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/utils";
import type { MealSelection, PlanResult, UserProfile } from "@/lib/types";

type Period = "breakfast" | "lunch" | "dinner";

const PERIOD_LABELS: Record<Period, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const DAY_INDEX_FROM_NAME: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function plannedSelectionFor(
  plan: PlanResult | null,
  isoDate: string,
  period: Period
): MealSelection | null {
  if (!plan) return null;
  // Match the plan's day by weekday name (rough: plan covers 7 days starting Mon).
  const dt = new Date(`${isoDate}T12:00:00`);
  const dow = dt.getDay(); // 0 = Sunday
  const targetIdx = dow === 0 ? 6 : dow - 1; // map to Mon=0..Sun=6
  const day = plan.days.find(
    (d) => DAY_INDEX_FROM_NAME[d.day] === targetIdx
  );
  if (!day) return null;
  return day.meals.find((m) => m.period === period) ?? null;
}

export default function LogPage() {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { plan } = useStoredPlan();
  const {
    entries,
    setEntry,
    removeEntry,
    hydrated: logHydrated,
  } = useEatenLog();
  const { meals: customMeals } = useCustomMeals();
  const [date, setDate] = useState(todayISO());

  // All hooks must be called before any conditional early return.
  const todayEntries = useMemo(() => {
    const out: Record<string, EatenEntry> = {};
    for (const [k, v] of Object.entries(entries)) {
      if (k.startsWith(`${date}-`)) out[k] = v;
    }
    return out;
  }, [entries, date]);

  const totals = useMemo(
    () => sumEntries(Object.values(todayEntries)),
    [todayEntries]
  );

  useEffect(() => {
    if (profileHydrated && !profile) {
      router.replace("/");
    }
  }, [profileHydrated, profile, router]);

  if (!profileHydrated || !logHydrated || !profile) {
    return (
      <div className="container mx-auto px-5 sm:px-8 py-24 text-center">
        <span className="eyebrow text-foreground/50">Loading…</span>
      </div>
    );
  }

  const targets = plan?.targets;

  return (
    <div className="container mx-auto px-5 sm:px-8 py-10 sm:py-14 max-w-5xl space-y-10">
      <header className="space-y-3">
        <div className="rule-double" />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2">
          <div>
            <span className="eyebrow text-foreground/60">Today, on the record</span>
            <h1 className="font-display text-4xl sm:text-6xl font-medium tracking-tight leading-[0.95]">
              The eating <span className="italic">log</span>.
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
              What you actually ate today. Adjust if you ate something different
              from the plan — the totals reflect what really landed on your plate.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-0 border-b border-foreground/30 bg-transparent py-2 text-sm font-mono-tabular focus:outline-none focus:border-foreground focus:border-b-2 cursor-pointer"
            />
          </div>
        </div>
        <div className="rule" />
      </header>

      {/* Day totals vs targets */}
      {targets && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-foreground/15 py-6">
          <TotalCell
            label="Calories"
            actual={totals.calories}
            target={targets.calories}
            unit="kcal"
            bar="bg-carolina"
          />
          <TotalCell
            label="Protein"
            actual={totals.proteinG}
            target={targets.proteinG}
            unit="g"
            bar="bg-foreground"
          />
          <TotalCell
            label="Carbs"
            actual={totals.carbsG}
            target={targets.carbsG}
            unit="g"
            bar="bg-carolina-deep"
          />
          <TotalCell
            label="Fat"
            actual={totals.fatG}
            target={targets.fatG}
            unit="g"
            bar="bg-accent"
          />
        </section>
      )}

      {/* Meal slots */}
      <section className="space-y-6">
        {(["breakfast", "lunch", "dinner"] as Period[]).map((period) => {
          const planned = plannedSelectionFor(plan, date, period);
          const entry = todayEntries[`${date}-${period}`];
          return (
            <MealLogRow
              key={period}
              date={date}
              period={period}
              entry={entry}
              planned={planned}
              customMeals={customMeals}
              profile={profile}
              onSave={(e) => setEntry(e)}
              onClear={() => removeEntry(date, period)}
            />
          );
        })}
      </section>

      <footer className="pt-8 border-t border-foreground/15 text-xs text-muted-foreground italic">
        Logged entries stay on this device. When account sign-in lands next
        session, your log syncs to your profile automatically.
      </footer>
    </div>
  );
}

function sumEntries(entries: EatenEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      proteinG: acc.proteinG + (e.proteinG ?? 0),
      carbsG: acc.carbsG + (e.carbsG ?? 0),
      fatG: acc.fatG + (e.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

function TotalCell({
  label,
  actual,
  target,
  unit,
  bar,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  bar: string;
}) {
  const delta = Math.round(actual - target);
  const onTrack = Math.abs(delta) < target * 0.1;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow text-foreground/55">{label}</span>
        <span
          className={cn(
            "text-[10px] font-mono-tabular tabular-nums",
            onTrack ? "text-success" : "text-warning"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta} {unit}
        </span>
      </div>
      <div>
        <span className="font-display text-2xl sm:text-3xl font-medium leading-none tracking-tight tabular-nums">
          {Math.round(actual)}
        </span>
        <span className="text-xs text-muted-foreground ml-1.5 font-mono-tabular">
          / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="h-1 bg-foreground/10 relative">
        <div
          className={cn("absolute inset-y-0 left-0", bar)}
          style={{
            width: `${Math.min(120, Math.max(0, (actual / target) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

function MealLogRow({
  date,
  period,
  entry,
  planned,
  customMeals,
  profile: _profile,
  onSave,
  onClear,
}: {
  date: string;
  period: Period;
  entry?: EatenEntry;
  planned: MealSelection | null;
  customMeals: CustomMeal[];
  profile: UserProfile;
  onSave: (entry: EatenEntry) => void;
  onClear: () => void;
}) {
  const [mode, setMode] = useState<EatenEntry["source"]>(
    entry?.source ?? "planned"
  );
  const [label, setLabel] = useState(entry?.label ?? "");
  const [calories, setCalories] = useState(entry?.calories ?? 0);
  const [proteinG, setProteinG] = useState(entry?.proteinG ?? 0);
  const [carbsG, setCarbsG] = useState(entry?.carbsG ?? 0);
  const [fatG, setFatG] = useState(entry?.fatG ?? 0);
  const isLogged = !!entry;

  // Sync local state when the underlying entry changes (e.g. date switch).
  useEffect(() => {
    setMode(entry?.source ?? "planned");
    setLabel(entry?.label ?? "");
    setCalories(entry?.calories ?? 0);
    setProteinG(entry?.proteinG ?? 0);
    setCarbsG(entry?.carbsG ?? 0);
    setFatG(entry?.fatG ?? 0);
  }, [entry]);

  const logPlanned = () => {
    if (!planned) return;
    onSave({
      date,
      period,
      source: "planned",
      label: planned.location,
      calories: planned.totals.calories,
      proteinG: planned.totals.proteinG,
      carbsG: planned.totals.totalCarbsG,
      fatG: planned.totals.totalFatG,
      loggedAt: Date.now(),
    });
  };

  const logSkipped = () => {
    onSave({
      date,
      period,
      source: "skipped",
      label: "Skipped",
      loggedAt: Date.now(),
    });
  };

  const logCustom = (m: CustomMeal) => {
    onSave({
      date,
      period,
      source: "custom",
      label: m.name,
      calories: m.calories,
      proteinG: m.proteinG,
      carbsG: m.carbsG,
      fatG: m.fatG,
      loggedAt: Date.now(),
    });
  };

  const saveEstimate = () => {
    onSave({
      date,
      period,
      source: "estimate",
      label: label.trim() || `${PERIOD_LABELS[period]} estimate`,
      calories,
      proteinG,
      carbsG,
      fatG,
      loggedAt: Date.now(),
    });
  };

  return (
    <article className="border border-foreground/15 bg-paper">
      <header className="px-4 sm:px-5 py-3 border-b border-foreground/15 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl tracking-tight">
            {PERIOD_LABELS[period]}
          </span>
          {isLogged ? (
            <span className="eyebrow text-[10px] text-success inline-flex items-center gap-1">
              <Check className="size-3" strokeWidth={2} />
              Logged
            </span>
          ) : (
            <span className="eyebrow text-[10px] text-foreground/45">
              Not yet logged
            </span>
          )}
        </div>
        {isLogged && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] eyebrow text-foreground/55 hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
          >
            <X className="size-3" strokeWidth={1.5} />
            Clear
          </button>
        )}
      </header>

      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* Planned summary on the left, what-I-ate selectors on the right */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-5">
            <div className="eyebrow text-foreground/55 mb-1.5">Planned</div>
            {planned && planned.items.length > 0 ? (
              <div className="space-y-1">
                <div className="text-sm font-medium tracking-tight">
                  {planned.location}
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {planned.items.slice(0, 3).map((it) => (
                    <li key={it.recipeId}>{it.name}</li>
                  ))}
                  {planned.items.length > 3 && (
                    <li className="italic">
                      + {planned.items.length - 3} more
                    </li>
                  )}
                </ul>
                <div className="text-xs font-mono-tabular text-foreground/70 pt-1">
                  {Math.round(planned.totals.calories)} kcal · P
                  {Math.round(planned.totals.proteinG)}g
                </div>
              </div>
            ) : planned?.external ? (
              <div className="text-sm italic text-muted-foreground">
                Marked off-campus —{" "}
                {planned.external.label?.trim() || "elsewhere"}.
              </div>
            ) : (
              <div className="text-sm italic text-muted-foreground">
                Nothing scheduled for this slot.
              </div>
            )}
          </div>

          <div className="sm:col-span-7 space-y-3">
            <div className="eyebrow text-foreground/55">What you ate</div>
            <SegmentedControl<EatenEntry["source"]>
              options={[
                { value: "planned", label: "Same as planned" },
                { value: "custom", label: "From library" },
                { value: "estimate", label: "Custom" },
                { value: "skipped", label: "Skipped" },
              ]}
              layout="grid"
              value={mode}
              onChange={setMode}
            />

            {mode === "planned" && (
              <div className="pt-1 flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={logPlanned}
                  disabled={!planned || planned.items.length === 0}
                  className="bg-carolina hover:bg-carolina/90 text-white"
                >
                  Log the plan
                </Button>
                {(!planned || planned.items.length === 0) && (
                  <span className="text-xs italic text-muted-foreground">
                    No planned items to log.
                  </span>
                )}
              </div>
            )}

            {mode === "custom" && (
              <div className="pt-1 space-y-1.5">
                {customMeals.length === 0 ? (
                  <div className="text-xs italic text-muted-foreground">
                    Your library is empty.{" "}
                    <Link
                      href="/customize"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      Add one in Customize →
                    </Link>
                  </div>
                ) : (
                  <ul className="max-h-56 overflow-y-auto border border-foreground/15 divide-y divide-foreground/10">
                    {customMeals.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => logCustom(m)}
                          className="w-full flex items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-foreground/5 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium tracking-tight truncate">
                              {m.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground italic">
                              {m.source === "homemade"
                                ? "Homemade"
                                : m.station || "Custom"}
                            </div>
                          </div>
                          <div className="text-[11px] font-mono-tabular text-foreground/70 tabular-nums shrink-0">
                            {m.calories} kcal · P{m.proteinG}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {mode === "estimate" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label>Where / what</Label>
                  <Input
                    value={label}
                    placeholder="e.g. He's Not Here, leftover pasta"
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                  <NumField
                    label="kcal"
                    value={calories}
                    onChange={setCalories}
                  />
                  <NumField
                    label="P (g)"
                    value={proteinG}
                    onChange={setProteinG}
                  />
                  <NumField
                    label="C (g)"
                    value={carbsG}
                    onChange={setCarbsG}
                  />
                  <NumField label="F (g)" value={fatG} onChange={setFatG} />
                </div>
                <Button
                  size="sm"
                  onClick={saveEstimate}
                  disabled={!label.trim() && calories === 0}
                  className="bg-carolina hover:bg-carolina/90 text-white"
                >
                  <NotebookPen className="size-3.5" strokeWidth={1.5} />
                  Save
                </Button>
              </div>
            )}

            {mode === "skipped" && (
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={logSkipped}
                  className="inline-flex items-center"
                >
                  <CircleSlash2 className="size-3.5" strokeWidth={1.5} />
                  Mark skipped
                </Button>
              </div>
            )}

            {entry && (
              <div className="pt-2 border-t border-foreground/15 text-xs text-foreground/70 font-mono-tabular">
                <span className="eyebrow text-foreground/55 mr-2">Saved</span>
                {entry.label || PERIOD_LABELS[period]} ·{" "}
                {Math.round(entry.calories ?? 0)} kcal · P
                {Math.round(entry.proteinG ?? 0)}g · C
                {Math.round(entry.carbsG ?? 0)}g · F
                {Math.round(entry.fatG ?? 0)}g
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) =>
          onChange(Math.max(0, parseInt(e.target.value || "0")))
        }
      />
    </div>
  );
}
