"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Check,
  Lock,
  LogOut,
  MapPin,
  RefreshCw,
  Shuffle,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  OnboardingWizard,
  DEFAULT_FORM,
  type FormState,
} from "@/components/OnboardingWizard";
import { useProfile, useStoredPlan } from "@/lib/use-app-data";

type Phase = "landing" | "wizard";

export default function Page() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const { profile, setProfile, hydrated: profileHydrated } = useProfile();
  const { plan, setPlan, hydrated: planHydrated } = useStoredPlan();
  const [phase, setPhase] = useState<Phase>("landing");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [wizardStep, setWizardStep] = useState(1);

  // Seed form from stored profile on first hydration so returning users
  // see their previous answers if they re-enter the wizard.
  useEffect(() => {
    if (profileHydrated && profile) {
      setForm((f) => ({
        ...f,
        age: profile.age,
        sex: profile.sex,
        heightFt: Math.floor(profile.heightCm / 2.54 / 12),
        heightIn: Math.round((profile.heightCm / 2.54) % 12),
        weightLb: Math.round(profile.weightKg / 0.453592),
        activity: profile.activity,
        goal: profile.goal,
        diet: profile.diet,
        avoidAllergens: profile.avoidAllergens,
        mealsOnCampus:
          profile.habits?.mealsOnCampus ??
          (["breakfast", "lunch", "dinner"] as const).slice(),
        weeklyCampusMeals: profile.habits?.weeklyCampusMeals ?? "most",
      }));
    }
  }, [profileHydrated, profile]);

  useEffect(() => {
    if (phase === "wizard") {
      window.scrollTo({ top: 0 });
    }
  }, [phase]);

  const startWizard = (atStep = 1) => {
    // Hard auth gate: anonymous users can't enter the wizard. They get
    // funneled to sign-up, and after a successful sign-in / sign-up they
    // are bounced back here, which then promotes them into the wizard.
    if (!isAuthed) {
      router.push("/signup");
      return;
    }
    setWizardStep(atStep);
    setPhase("wizard");
  };

  const hasExistingPlan = profileHydrated && planHydrated && !!profile && !!plan;

  // First-time authed users with no profile yet land here — drop them
  // straight into the wizard so the auth flow feels continuous.
  useEffect(() => {
    if (isAuthed && profileHydrated && planHydrated && !profile) {
      setWizardStep(1);
      setPhase("wizard");
    }
  }, [isAuthed, profileHydrated, planHydrated, profile]);

  return (
    <div className="flex-1 flex flex-col">
      {phase === "landing" && (
        <Landing
          hasExistingPlan={hasExistingPlan}
          isAuthed={isAuthed}
          onStart={() => startWizard(1)}
          onOpenPlan={() => router.push("/plan")}
        />
      )}
      {phase === "wizard" && (
        <div className="container mx-auto px-5 sm:px-8 py-10 sm:py-16">
          <OnboardingWizard
            initialForm={form}
            initialStep={wizardStep}
            onFormChange={setForm}
            onStepChange={setWizardStep}
            onComplete={(newPlan, newProfile) => {
              setProfile(newProfile);
              setPlan(newPlan);
              router.push("/plan");
            }}
          />
        </div>
      )}
    </div>
  );
}

function Landing({
  hasExistingPlan,
  isAuthed,
  onStart,
  onOpenPlan,
}: {
  hasExistingPlan: boolean;
  isAuthed: boolean;
  onStart: () => void;
  onOpenPlan: () => void;
}) {
  return (
    <div className="animate-fade-up flex-1 flex flex-col">
      <Hero
        isAuthed={isAuthed}
        hasExistingPlan={hasExistingPlan}
        onStart={onStart}
        onOpenPlan={onOpenPlan}
      />
      <StatStrip />
      <HowItWorks />
      <FeatureIndex />
      <Locations />
      <ClosingCTA
        hasExistingPlan={hasExistingPlan}
        onStart={onStart}
        onOpenPlan={onOpenPlan}
      />
    </div>
  );
}

function Hero({
  hasExistingPlan,
  isAuthed,
  onStart,
  onOpenPlan,
}: {
  hasExistingPlan: boolean;
  isAuthed: boolean;
  onStart: () => void;
  onOpenPlan: () => void;
}) {
  return (
    <section>
      <div className="container mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-7">
        <div className="font-mono-tabular text-xs tracking-[0.18em] uppercase text-muted-foreground">
          UNC Chapel Hill · Meal planner
        </div>

        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] leading-[0.88] text-6xl sm:text-8xl xl:text-[10rem]">
          {hasExistingPlan ? (
            <>
              Back
              <br />
              <span className="text-carolina">at it.</span>
            </>
          ) : (
            <>
              Your week,
              <br />
              <span className="text-carolina">planned.</span>
            </>
          )}
        </h1>

        <p className="text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-xl">
          {hasExistingPlan
            ? "Your plan, library and ratings are right where you left them."
            : "Seven days of real dining-hall meals, tuned to your macros."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center pt-1">
          {hasExistingPlan ? (
            <>
              <Button
                onClick={onOpenPlan}
                size="lg"
                className="bg-carolina hover:bg-carolina/90 text-white"
              >
                <BookOpenText className="size-4" strokeWidth={1.5} />
                Open my plan
              </Button>
              <button
                onClick={onStart}
                className="text-sm underline underline-offset-[5px] decoration-foreground/40 hover:decoration-foreground px-3 py-2 cursor-pointer text-left"
              >
                Rebuild from scratch →
              </button>
            </>
          ) : isAuthed ? (
            <Button
              onClick={onStart}
              size="lg"
              className="bg-carolina hover:bg-carolina/90 text-white"
            >
              Build my plan
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
          ) : (
            <>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-carolina hover:bg-carolina/90 text-white"
                >
                  Build my plan
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </Button>
              </Link>
              <Link href="/preview">
                <Button size="lg" variant="outline">
                  See a sample
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const STATS: { big: string; label: string }[] = [
  { big: "7 days", label: "Every week" },
  { big: "11 spots", label: "Real CDS menus" },
  { big: "3 meals", label: "Macro-tuned daily" },
  { big: "60 sec", label: "To set up" },
];

function StatStrip() {
  return (
    <section className="border-y-2 border-foreground">
      <div className="container mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.big}
            className={`py-6 sm:py-7 pr-6 flex flex-col gap-1.5 ${
              i > 0 ? "md:border-l md:border-hairline md:pl-8" : ""
            }`}
          >
            <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.02em]">
              {s.big}
            </div>
            <div className="font-mono-tabular text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniChips() {
  return (
    <div className="flex flex-wrap gap-2 md:w-[420px] md:justify-end">
      {["Lean bulk", "No gluten", "Block 200", "Lunch at 1", "Late dinner"].map(
        (c) => (
          <span
            key={c}
            className="border-[1.5px] border-foreground rounded-full px-3.5 py-2 text-[13px] font-medium"
          >
            {c}
          </span>
        )
      )}
    </div>
  );
}

function MiniMealCard() {
  return (
    <div className="border border-hairline rounded-lg bg-card p-4 space-y-2.5 md:w-[420px]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-carolina-deep">
          <MapPin className="size-3.5" strokeWidth={2} />
          Top of Lenoir
        </span>
        <span className="font-mono-tabular text-[11px] text-muted-foreground">
          800 KCAL · 44P
        </span>
      </div>
      <div className="space-y-1.5 text-[13px]">
        {[
          ["Cheddar Omelet", "290"],
          ["Cinnamon French Toast", "360"],
          ["Old Fashioned Oatmeal", "150"],
        ].map(([name, kcal]) => (
          <div key={name} className="flex justify-between">
            <span>{name}</span>
            <span className="font-mono-tabular text-muted-foreground">
              {kcal}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLogCard() {
  return (
    <div className="border border-hairline rounded-lg bg-card p-4 space-y-3 md:w-[420px]">
      <div className="flex items-baseline gap-2">
        <span className="font-display font-extrabold text-3xl">1,240</span>
        <span className="font-mono-tabular text-[11px] text-muted-foreground">
          OF 2,950 KCAL
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className="h-2.5 w-[42%] bg-carolina rounded-full" />
      </div>
      <div className="flex items-center gap-2 text-[13px] font-medium text-success">
        <Check className="size-3.5" strokeWidth={2.5} />
        Breakfast logged
      </div>
    </div>
  );
}

const STEPS: {
  num: string;
  title: string;
  body: string;
  visual: () => React.ReactNode;
  reverse?: boolean;
}[] = [
  {
    num: "01",
    title: "Tell us you",
    body: "Goal, diet, schedule, meal plan. One minute.",
    visual: MiniChips,
  },
  {
    num: "02",
    title: "Get the week",
    body: "Every meal from one spot. Hits your numbers.",
    visual: MiniMealCard,
    reverse: true,
  },
  {
    num: "03",
    title: "Log it",
    body: "One tap per meal. Totals update live.",
    visual: MiniLogCard,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works">
      <div className="container mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="font-mono-tabular text-xs tracking-[0.18em] uppercase text-muted-foreground pb-2">
          How it works
        </div>
        {STEPS.map((s, i) => {
          const Visual = s.visual;
          return (
            <div
              key={s.num}
              className={`flex flex-col gap-8 py-9 md:items-center md:gap-16 ${
                s.reverse ? "md:flex-row-reverse" : "md:flex-row"
              } ${i < STEPS.length - 1 ? "border-b border-hairline" : ""}`}
            >
              <div className="flex-grow space-y-3">
                <div className="font-mono-tabular text-[13px] font-medium text-carolina">
                  {s.num}
                </div>
                <h3 className="font-display font-extrabold uppercase tracking-[-0.02em] text-4xl sm:text-5xl">
                  {s.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground max-w-sm">
                  {s.body}
                </p>
              </div>
              <Visual />
            </div>
          );
        })}
      </div>
    </section>
  );
}

const FEATURES: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  tag: string;
}[] = [
  { icon: Shuffle, title: "Swap meals", tag: "same macros" },
  { icon: CalendarDays, title: "To calendar", tag: "week as events" },
  { icon: Lock, title: "Pin favorites", tag: "survive rebuilds" },
  { icon: ThumbsUp, title: "It learns", tag: "rate, improve" },
  { icon: LogOut, title: "Eating out", tag: "day rebalances" },
  { icon: RefreshCw, title: "Syncs", tag: "every device" },
];

function FeatureIndex() {
  return (
    <section className="bg-carolina-deep text-paper">
      <div className="container mx-auto px-5 sm:px-8 py-12 sm:py-14 space-y-6">
        <div className="font-mono-tabular text-xs tracking-[0.18em] uppercase text-carolina-soft">
          Everything works
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`flex items-center gap-4 py-4 ${
                i < FEATURES.length - 2 ? "border-b border-carolina-soft/20" : ""
              } ${i === FEATURES.length - 2 ? "border-b md:border-b-0 border-carolina-soft/20" : ""}`}
            >
              <f.icon className="size-5 text-carolina shrink-0" strokeWidth={2} />
              <span className="font-display font-extrabold uppercase text-lg sm:text-xl tracking-[-0.01em]">
                {f.title}
              </span>
              <span className="ml-auto text-sm text-carolina-soft">{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SPOTS = [
  "Top of Lenoir",
  "Chase",
  "Café 1789",
  "Chick-fil-A",
  "Subway",
  "Bojangles",
  "Med Deli",
  "Alpaca",
  "IP3",
  "La Farm",
  "Bandidos",
];

function Locations() {
  return (
    <section>
      <div className="container mx-auto px-5 sm:px-8 py-14 sm:py-20 space-y-7">
        <h2 className="font-display font-extrabold uppercase tracking-[-0.03em] text-5xl sm:text-7xl">
          Real menus.
        </h2>
        <div className="flex flex-wrap gap-2.5 max-w-4xl">
          {SPOTS.map((spot) => (
            <span
              key={spot}
              className="bg-carolina-tint border-[1.5px] border-carolina text-carolina-deep rounded-full px-4 py-2 text-sm font-semibold"
            >
              {spot}
            </span>
          ))}
        </div>
        <p className="text-[15px] text-muted-foreground">
          Scraped daily from{" "}
          <a
            href="https://dining.unc.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground hover:text-foreground"
          >
            dining.unc.edu
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function ClosingCTA({
  hasExistingPlan,
  onStart,
  onOpenPlan,
}: {
  hasExistingPlan: boolean;
  onStart: () => void;
  onOpenPlan: () => void;
}) {
  return (
    <section className="pb-14 sm:pb-20">
      <div className="container mx-auto px-5 sm:px-8">
        <div className="bg-carolina rounded-lg px-8 py-12 sm:px-14 sm:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <h2 className="font-display font-extrabold uppercase tracking-[-0.03em] leading-[0.9] text-5xl sm:text-7xl text-white">
            {hasExistingPlan ? "Keep going." : "Fuel up."}
          </h2>
          {hasExistingPlan ? (
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={onOpenPlan}
                size="lg"
                className="bg-foreground text-paper hover:bg-foreground/90"
              >
                Open my plan
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Button>
              <Link
                href="/log"
                className="text-white underline underline-offset-4 decoration-white/50 hover:decoration-white text-sm"
              >
                Log today →
              </Link>
            </div>
          ) : (
            <Button
              onClick={onStart}
              size="lg"
              className="bg-foreground text-paper hover:bg-foreground/90"
            >
              Build my plan
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
