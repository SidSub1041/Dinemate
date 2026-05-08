"use client";

import { useState } from "react";
import { RotateCcw, MapPin, Sun, Moon, Sunset } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatNumber } from "@/lib/utils";
import type { MealPeriod, MealSelection, PlanResult } from "@/lib/types";

const MEAL_META: Record<
  Exclude<MealPeriod, "late_lunch">,
  { label: string; icon: typeof Sun; numeral: string }
> = {
  breakfast: { label: "Breakfast", icon: Sun, numeral: "I." },
  lunch: { label: "Lunch", icon: Sunset, numeral: "II." },
  dinner: { label: "Dinner", icon: Moon, numeral: "III." },
};

interface Props {
  plan: PlanResult;
  onRestart: () => void;
}

export function PlanView({ plan, onRestart }: Props) {
  const [activeDay, setActiveDay] = useState(0);
  const day = plan.days[activeDay];
  const t = plan.targets;

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-up space-y-12">
      {/* Masthead */}
      <header className="space-y-6">
        <div className="rule-double" />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="eyebrow text-foreground/60">
              The week ahead, in calories
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-medium tracking-tight leading-[0.95] mt-2">
              Your <span className="italic">prescription</span>
            </h1>
          </div>
          <Button variant="outline" onClick={onRestart} size="sm">
            <RotateCcw className="size-3.5" strokeWidth={1.5} />
            Start over
          </Button>
        </div>
        <div className="rule" />

        {/* Daily targets — newspaper-style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-foreground/15 border-y border-foreground/15 -mx-2">
          <TargetCell
            label="Calories / day"
            value={formatNumber(t.calories)}
            unit="kcal"
            primary
          />
          <TargetCell
            label="Protein"
            value={t.proteinG}
            unit={`g  •  ${formatNumber(t.proteinG * 4)} kcal`}
          />
          <TargetCell
            label="Carbs"
            value={t.carbsG}
            unit={`g  •  ${formatNumber(t.carbsG * 4)} kcal`}
          />
          <TargetCell
            label="Fat"
            value={t.fatG}
            unit={`g  •  ${formatNumber(t.fatG * 9)} kcal`}
          />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>
            <span className="eyebrow text-foreground/50 mr-1.5">BMR</span>
            <span className="font-mono-tabular">{formatNumber(t.bmr)} kcal</span>
          </span>
          <span>
            <span className="eyebrow text-foreground/50 mr-1.5">TDEE</span>
            <span className="font-mono-tabular">{formatNumber(t.tdee)} kcal</span>
          </span>
          <span>
            <span className="eyebrow text-foreground/50 mr-1.5">Source</span>
            Carolina Dining Services menus
          </span>
        </div>
      </header>

      {/* Day index — like a TV guide */}
      <section className="space-y-4 scroll-mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow text-foreground/60">The week</h2>
          <span className="text-xs text-muted-foreground italic">
            seven days, drawn from today&apos;s rotation
          </span>
        </div>
        <div className="grid grid-cols-7 border border-foreground">
          {plan.days.map((d, i) => (
            <button
              key={`${d.day}-${i}`}
              onClick={() => setActiveDay(i)}
              className={cn(
                "flex flex-col items-start gap-1 px-3 py-3 text-left transition-colors border-r border-foreground last:border-r-0 cursor-pointer",
                activeDay === i
                  ? "bg-foreground text-paper"
                  : "bg-paper text-foreground hover:bg-foreground/5"
              )}
            >
              <span
                className={cn(
                  "eyebrow text-[9px]",
                  activeDay === i ? "text-paper/60" : "text-foreground/50"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-base sm:text-lg leading-none tracking-tight">
                {d.day.slice(0, 3)}
              </span>
              <span
                className={cn(
                  "hidden sm:block text-[10px] font-mono-tabular leading-tight",
                  activeDay === i ? "text-paper/70" : "text-muted-foreground"
                )}
              >
                {Math.round(d.totals.calories)} k
              </span>
            </button>
          ))}
        </div>
      </section>

      <DayBreakdown day={day} targets={t} />

      <footer className="pt-8 border-t border-foreground/20 text-xs text-muted-foreground italic">
        Calorie targets are estimates. Portion guidance is based on the dining
        hall&apos;s published serving size — adjust to your hunger, not the chart.
      </footer>
    </div>
  );
}

function TargetCell({
  label,
  value,
  unit,
  primary,
}: {
  label: string;
  value: string | number;
  unit?: string;
  primary?: boolean;
}) {
  return (
    <div className="px-3 py-5 sm:px-5">
      <div className="eyebrow text-foreground/55">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display font-medium leading-none tracking-tight tabular-nums",
            primary ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
          )}
        >
          {value}
        </span>
      </div>
      {unit && (
        <div className="text-[11px] text-muted-foreground mt-1.5 font-mono-tabular">
          {unit}
        </div>
      )}
    </div>
  );
}

function DayBreakdown({
  day,
  targets,
}: {
  day: PlanResult["days"][0];
  targets: PlanResult["targets"];
}) {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="eyebrow text-foreground/55">{day.day}</span>
            <h3 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
              By the numbers
            </h3>
          </div>
          <span className="text-xs text-muted-foreground italic hidden sm:block">
            actual vs. target
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 border-t border-b border-foreground/15 py-6">
          <MacroLine
            label="Calories"
            actual={day.totals.calories}
            target={targets.calories}
            unit="kcal"
          />
          <MacroLine
            label="Protein"
            actual={day.totals.proteinG}
            target={targets.proteinG}
            unit="g"
          />
          <MacroLine
            label="Carbs"
            actual={day.totals.totalCarbsG}
            target={targets.carbsG}
            unit="g"
          />
          <MacroLine
            label="Fat"
            actual={day.totals.totalFatG}
            target={targets.fatG}
            unit="g"
          />
        </div>
      </section>

      <section className="space-y-8">
        {day.meals.map((meal, idx) => (
          <MealArticle key={idx} meal={meal} />
        ))}
      </section>
    </div>
  );
}

function MacroLine({
  label,
  actual,
  target,
  unit,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
}) {
  const delta = actual - target;
  const pct = target > 0 ? (actual / target) * 100 : 0;
  const onTrack = Math.abs(delta) < target * 0.1;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow text-foreground/55">{label}</span>
        <span
          className={cn(
            "text-[10px] font-mono-tabular tabular-nums",
            onTrack ? "text-success" : "text-warning"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {Math.round(delta)} {unit}
        </span>
      </div>
      <div>
        <span className="font-display text-3xl sm:text-4xl font-medium leading-none tracking-tight tabular-nums">
          {Math.round(actual)}
        </span>
        <span className="text-xs text-muted-foreground ml-1.5 font-mono-tabular">
          / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="h-px bg-foreground/10 relative">
        <div
          className="absolute inset-y-0 left-0 bg-foreground"
          style={{ width: `${Math.min(120, Math.max(0, pct))}%` }}
        />
        <div
          className="absolute -top-px -bottom-px w-px bg-foreground/40"
          style={{ left: "100%" }}
        />
      </div>
    </div>
  );
}

function MealArticle({ meal }: { meal: MealSelection }) {
  if (meal.period === "late_lunch") return null;
  const meta = MEAL_META[meal.period];
  const Icon = meta.icon;
  return (
    <article className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-10 pb-8 border-b border-foreground/15 last:border-0">
      <header className="sm:col-span-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display italic text-3xl text-foreground/40 tabular-nums">
            {meta.numeral}
          </span>
          <Icon className="size-4 text-foreground/60" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight mt-1">
          {meta.label}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <MapPin className="size-3" strokeWidth={1.5} />
          <span>{meal.location}</span>
        </div>
        <div className="mt-4 space-y-1 font-mono-tabular text-xs">
          <div>
            <span className="eyebrow text-foreground/50 mr-2">kcal</span>
            <span className="tabular-nums">
              {Math.round(meal.totals.calories)}
            </span>
          </div>
          <div>
            <span className="eyebrow text-foreground/50 mr-2">P</span>
            <span className="tabular-nums">
              {Math.round(meal.totals.proteinG)}g
            </span>
            <span className="eyebrow text-foreground/50 ml-3 mr-2">C</span>
            <span className="tabular-nums">
              {Math.round(meal.totals.totalCarbsG)}g
            </span>
            <span className="eyebrow text-foreground/50 ml-3 mr-2">F</span>
            <span className="tabular-nums">
              {Math.round(meal.totals.totalFatG)}g
            </span>
          </div>
        </div>
      </header>

      <div className="sm:col-span-9">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground/30 text-left">
              <th className="eyebrow text-foreground/55 pb-2 font-normal">
                Item
              </th>
              <th className="eyebrow text-foreground/55 pb-2 font-normal text-right hidden sm:table-cell">
                Serving
              </th>
              <th className="eyebrow text-foreground/55 pb-2 font-normal text-right pl-4 sm:pl-6">
                Protein
              </th>
              <th className="eyebrow text-foreground/55 pb-2 font-normal text-right pl-4 sm:pl-6">
                kcal
              </th>
            </tr>
          </thead>
          <tbody>
            {meal.items.map((it) => (
              <tr
                key={it.recipeId}
                className="border-b border-foreground/10 last:border-0 align-top"
              >
                <td className="py-3 pr-2">
                  <div className="font-medium text-sm leading-snug tracking-tight">
                    {it.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 italic">
                    {it.station}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {it.diets.includes("vegan") && (
                      <DietTag>Vegan</DietTag>
                    )}
                    {it.diets.includes("vegetarian") &&
                      !it.diets.includes("vegan") && (
                        <DietTag>Vegetarian</DietTag>
                      )}
                    {it.diets.includes("made_without_gluten") && (
                      <DietTag>GF</DietTag>
                    )}
                    {it.diets.includes("halal") && <DietTag>Halal</DietTag>}
                  </div>
                </td>
                <td className="py-3 text-right text-xs font-mono-tabular text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                  {it.nutrition?.servingSize || "—"}
                </td>
                <td className="py-3 text-right font-mono-tabular tabular-nums text-sm whitespace-nowrap pl-4 sm:pl-6">
                  {Math.round(it.nutrition?.proteinG ?? 0)}g
                </td>
                <td className="py-3 text-right font-mono-tabular tabular-nums text-sm whitespace-nowrap font-medium pl-4 sm:pl-6">
                  {it.nutrition?.calories ?? 0}
                </td>
              </tr>
            ))}
            <tr>
              <td className="pt-3">
                <span className="eyebrow text-foreground/55">Total</span>
              </td>
              <td className="hidden sm:table-cell" />
              <td className="pt-3 text-right font-mono-tabular tabular-nums text-sm font-medium pl-4 sm:pl-6">
                {Math.round(meal.totals.proteinG)}g
              </td>
              <td className="pt-3 text-right font-mono-tabular tabular-nums text-sm font-medium pl-4 sm:pl-6">
                {Math.round(meal.totals.calories)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}

function DietTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-foreground/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-foreground/70 font-medium">
      {children}
    </span>
  );
}
