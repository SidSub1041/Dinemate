"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  MapPin,
  Loader2,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

import { cn, formatNumber } from "@/lib/utils";
import type {
  MealPeriod,
  MealSelection,
  PlanResult,
} from "@/lib/types";

const MEAL_META: Record<
  Exclude<MealPeriod, "late_lunch">,
  { label: string; icon: typeof Sun; numeral: string }
> = {
  breakfast: { label: "Breakfast", icon: Sun, numeral: "I." },
  lunch: { label: "Lunch", icon: Sunset, numeral: "II." },
  dinner: { label: "Dinner", icon: Moon, numeral: "III." },
};

/**
 * A static demo profile used purely to generate the sample day. Anyone
 * can land on /preview, so the inputs need to produce a sensible plan
 * without any user input.
 */
export default function PreviewPage() {
  const router = useRouter();
  const { status } = useSession();
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Authed users get bounced to their real plan — preview is for visitors.
  useEffect(() => {
    if (status === "authenticated") router.replace("/plan");
  }, [status, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Public teaser endpoint: the server fixes the profile and
        // returns a single day, so the full week is never sent to a
        // signed-out visitor.
        const res = await fetch("/api/preview-plan", { method: "POST" });
        if (!res.ok) return;
        const data = (await res.json()) as PlanResult;
        if (!cancelled) setPlan(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const day = plan?.days[0];

  return (
    <div className="flex-1">
      <PreviewCover targets={plan?.targets} />
      <div className="container mx-auto px-5 sm:px-8 max-w-6xl py-10 sm:py-14 space-y-10">
        <section>
          <div className="rule-double mb-6" />
          <span className="eyebrow text-foreground/55">A sample day</span>
          <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-tight leading-tight mt-2">
            Monday, as a demo.
          </h2>
          <p className="text-sm text-muted-foreground italic mt-2 max-w-xl">
            Built with default targets. Sign up to tune for your goals,
            schedule and meal plan — then we generate the full seven days.
          </p>
        </section>

        {loading && !plan && (
          <div className="border border-foreground/15 px-5 py-12 text-center">
            <Loader2 className="size-5 animate-spin inline mr-2" />
            <span className="eyebrow text-foreground/55">
              Building the demo
            </span>
          </div>
        )}

        {day && (
          <>
            <section className="space-y-6">
              {day.meals.map((meal, idx) => (
                <PreviewMealCard key={idx} meal={meal} />
              ))}
            </section>

            <SignUpGate />
          </>
        )}
      </div>
    </div>
  );
}

function PreviewCover({ targets }: { targets?: PlanResult["targets"] }) {
  return (
    <section className="relative border-b border-foreground bg-carolina-deep text-paper overflow-hidden">
      <div className="container mx-auto px-5 sm:px-8 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8 items-end">
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-carolina" />
            <span className="eyebrow text-paper/65">Sample preview · No account</span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-medium leading-[0.95] tracking-tight">
            Here&apos;s a{" "}
            <span className="italic font-display-wonk">taste</span>
            <span className="text-carolina">.</span>
          </h1>
          <p className="text-paper/80 max-w-lg text-base sm:text-lg leading-relaxed">
            A made-up day to show the format. Your real plan needs an
            account — that&apos;s what saves and adapts across devices.
          </p>
        </div>
        <div className="lg:col-span-4 space-y-3">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-carolina text-white hover:bg-carolina/90 border border-carolina"
            >
              <Lock className="size-3.5" strokeWidth={1.5} />
              Sign up for the full plan
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
          </Link>
          {targets && (
            <div className="text-[11px] font-mono-tabular text-paper/65 space-x-4">
              <span>
                <span className="eyebrow text-paper/45 mr-1">BMR</span>
                {formatNumber(targets.bmr)}
              </span>
              <span>
                <span className="eyebrow text-paper/45 mr-1">TDEE</span>
                {formatNumber(targets.tdee)}
              </span>
            </div>
          )}
        </div>
      </div>

      {targets && (
        <div className="relative border-t border-paper/20">
          <div className="container mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 divide-x divide-paper/15">
            <CoverCell label="Calories" value={formatNumber(targets.calories)} unit="kcal" />
            <CoverCell label="Protein" value={targets.proteinG} unit="grams" />
            <CoverCell label="Carbs" value={targets.carbsG} unit="grams" />
            <CoverCell label="Fat" value={targets.fatG} unit="grams" />
          </div>
        </div>
      )}
    </section>
  );
}

function CoverCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="px-3 py-5 sm:px-5">
      <div className="eyebrow text-paper/55">{label}</div>
      <div className="mt-2">
        <span className="font-display font-medium leading-none tracking-tight tabular-nums text-3xl sm:text-4xl text-paper">
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

function PreviewMealCard({ meal }: { meal: MealSelection }) {
  if (meal.period === "late_lunch") return null;
  const meta = MEAL_META[meal.period];
  const Icon = meta.icon;
  return (
    <article className="border border-foreground/15 px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-12 gap-x-8 gap-y-3">
      <header className="sm:col-span-3">
        <div className="flex items-center gap-3">
          <span className="font-display italic text-2xl text-carolina-deep/60">
            {meta.numeral}
          </span>
          <span className="size-7 inline-flex items-center justify-center bg-carolina-tint text-carolina-deep rounded-full">
            <Icon className="size-3.5" strokeWidth={1.5} />
          </span>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight leading-tight mt-1.5">
          {meta.label}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <MapPin className="size-3" strokeWidth={1.5} />
          <span>{meal.location}</span>
        </div>
      </header>
      <ul className="sm:col-span-9 divide-y divide-foreground/10">
        {meal.items.map((it) => (
          <li
            key={it.recipeId}
            className="py-2 flex items-baseline justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium tracking-tight">{it.name}</div>
              <div className="text-[11px] text-muted-foreground italic">{it.station}</div>
            </div>
            <div className="text-xs font-mono-tabular tabular-nums whitespace-nowrap text-foreground/80">
              {Math.round(it.nutrition?.proteinG ?? 0)}g P · {it.nutrition?.calories ?? 0} kcal
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SignUpGate() {
  return (
    <section className="border-t border-foreground/20 pt-10">
      <div className="border border-foreground bg-paper px-6 py-8 sm:px-10 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <span className="eyebrow text-foreground/55">The other six days</span>
          <h3 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
            Want the rest of the week?
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-xl">
            Sign up free — your profile, ratings, log and library save to
            your account and follow you across devices.
          </p>
        </div>
        <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
          <Link href="/signup">
            <Button size="lg" className="bg-carolina hover:bg-carolina/90 text-white">
              <Lock className="size-3.5" strokeWidth={1.5} />
              Sign up
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
          </Link>
          <Link
            href="/signin"
            className="self-center text-sm text-foreground/65 hover:text-foreground underline underline-offset-4"
          >
            Already have an account?
          </Link>
        </div>
      </div>
    </section>
  );
}
