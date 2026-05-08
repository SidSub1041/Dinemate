"use client";

import Image from "next/image";
import { useState } from "react";
import { RotateCcw, MapPin, Sun, Moon, Sunset } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatNumber } from "@/lib/utils";
import { PLAN_COVER } from "@/lib/images";
import type { MealPeriod, MealSelection, PlanResult } from "@/lib/types";

const MEAL_META: Record<
  Exclude<MealPeriod, "late_lunch">,
  { label: string; icon: typeof Sun; numeral: string; mood: string }
> = {
  breakfast: {
    label: "Breakfast",
    icon: Sun,
    numeral: "I.",
    mood: "the start",
  },
  lunch: {
    label: "Lunch",
    icon: Sunset,
    numeral: "II.",
    mood: "midday",
  },
  dinner: {
    label: "Dinner",
    icon: Moon,
    numeral: "III.",
    mood: "to close",
  },
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
    <div className="w-full animate-fade-up space-y-12">
      {/* Cover band */}
      <PlanCover totals={t} onRestart={onRestart} />

      <div className="max-w-6xl mx-auto px-1 sm:px-0 space-y-12">
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
                  "flex flex-col items-start gap-1 px-3 py-3 text-left transition-colors border-r border-foreground last:border-r-0 cursor-pointer relative",
                  activeDay === i
                    ? "bg-foreground text-paper"
                    : "bg-paper text-foreground hover:bg-foreground/5"
                )}
              >
                {activeDay === i && (
                  <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-carolina" />
                )}
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
          Calorie targets are estimates. Portion guidance is based on the
          dining hall&apos;s published serving size — adjust to your hunger,
          not the chart.
        </footer>
      </div>
    </div>
  );
}

function PlanCover({
  totals: t,
  onRestart,
}: {
  totals: PlanResult["targets"];
  onRestart: () => void;
}) {
  return (
    <section className="relative border-b border-foreground bg-carolina-deep text-paper overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={PLAN_COVER.src}
          alt={PLAN_COVER.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-carolina-deep via-carolina-deep/85 to-carolina-deep/55" />
      </div>

      <div className="relative container mx-auto px-5 sm:px-8 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8 items-end">
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-carolina" />
            <span className="eyebrow text-paper/65">
              The Plan · Issued for you
            </span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-medium leading-[0.95] tracking-tight">
            Your <span className="italic font-display-wonk">prescription</span>
            <span className="text-carolina">.</span>
          </h1>
          <p className="text-paper/80 max-w-lg text-base sm:text-lg leading-relaxed">
            Seven days of breakfast, lunch and dinner — pulled from real
            Carolina Dining Services menus and tuned to your numbers.
          </p>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <Button
            variant="secondary"
            onClick={onRestart}
            size="sm"
            className="bg-paper text-foreground hover:bg-paper/90 border-paper"
          >
            <RotateCcw className="size-3.5" strokeWidth={1.5} />
            Edit my profile
          </Button>
          <div className="text-[11px] font-mono-tabular text-paper/65 space-x-4">
            <span>
              <span className="eyebrow text-paper/45 mr-1">BMR</span>
              {formatNumber(t.bmr)}
            </span>
            <span>
              <span className="eyebrow text-paper/45 mr-1">TDEE</span>
              {formatNumber(t.tdee)}
            </span>
          </div>
        </div>
      </div>

      {/* Daily targets on a band below */}
      <div className="relative border-t border-paper/20">
        <div className="container mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 divide-x divide-paper/15">
          <CoverCell
            label="Calories / day"
            value={formatNumber(t.calories)}
            unit="kcal"
            primary
          />
          <CoverCell
            label="Protein"
            value={t.proteinG}
            unit="grams"
          />
          <CoverCell
            label="Carbs"
            value={t.carbsG}
            unit="grams"
          />
          <CoverCell
            label="Fat"
            value={t.fatG}
            unit="grams"
          />
        </div>
      </div>
    </section>
  );
}

function CoverCell({
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
      <div className="eyebrow text-paper/55">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display font-medium leading-none tracking-tight tabular-nums text-paper",
            primary ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
          )}
        >
          {value}
        </span>
      </div>
      {unit && (
        <div className="text-[11px] text-paper/55 mt-1.5 font-mono-tabular">
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
            barColor="bg-carolina"
          />
          <MacroLine
            label="Protein"
            actual={day.totals.proteinG}
            target={targets.proteinG}
            unit="g"
            barColor="bg-foreground"
          />
          <MacroLine
            label="Carbs"
            actual={day.totals.totalCarbsG}
            target={targets.carbsG}
            unit="g"
            barColor="bg-carolina-deep"
          />
          <MacroLine
            label="Fat"
            actual={day.totals.totalFatG}
            target={targets.fatG}
            unit="g"
            barColor="bg-accent"
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
  barColor,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  barColor: string;
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
      <div className="h-1.5 bg-foreground/10 relative">
        <div
          className={cn("absolute inset-y-0 left-0", barColor)}
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
        <div className="flex items-center gap-3">
          <span className="font-display italic text-3xl text-carolina-deep/60 tabular-nums">
            {meta.numeral}
          </span>
          <span className="size-8 inline-flex items-center justify-center bg-carolina-tint text-carolina-deep rounded-full">
            <Icon className="size-4" strokeWidth={1.5} />
          </span>
        </div>
        <h3 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight mt-2">
          {meta.label}
        </h3>
        <div className="text-xs italic text-muted-foreground mt-0.5">
          — {meta.mood}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
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
