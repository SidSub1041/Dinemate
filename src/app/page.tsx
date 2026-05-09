"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  OnboardingWizard,
  DEFAULT_FORM,
  type FormState,
} from "@/components/OnboardingWizard";
import { PlanView } from "@/components/PlanView";
import {
  HERO_FOOD,
  STEP_TELL_US,
  STEP_MATH,
  STEP_EAT,
  UNC_OLD_WELL,
} from "@/lib/images";
import type { PlanResult, UserProfile } from "@/lib/types";

type AppState =
  | { phase: "landing" }
  | { phase: "wizard" }
  | { phase: "plan"; plan: PlanResult; profile: UserProfile };

function planUpdater(
  setState: React.Dispatch<React.SetStateAction<AppState>>
) {
  return (newPlan: PlanResult) =>
    setState((s) => (s.phase === "plan" ? { ...s, plan: newPlan } : s));
}

export default function Page() {
  const [state, setState] = useState<AppState>({ phase: "landing" });
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [wizardStep, setWizardStep] = useState(1);

  useEffect(() => {
    if (state.phase !== "landing") {
      window.scrollTo({ top: 0 });
    }
  }, [state.phase]);

  return (
    <div className="flex flex-col flex-1">
      <Masthead onStart={() => setState({ phase: "wizard" })} />
      <main className="flex-1">
        {state.phase === "landing" && (
          <Landing onStart={() => setState({ phase: "wizard" })} />
        )}
        {state.phase === "wizard" && (
          <div className="container mx-auto px-5 sm:px-8 py-10 sm:py-16">
            <OnboardingWizard
              initialForm={form}
              initialStep={wizardStep}
              onFormChange={setForm}
              onStepChange={setWizardStep}
              onComplete={(plan, profile) =>
                setState({ phase: "plan", plan, profile })
              }
            />
          </div>
        )}
        {state.phase === "plan" && (
          <div className="pb-16">
            <PlanView
              plan={state.plan}
              profile={state.profile}
              onPlanUpdate={planUpdater(setState)}
              onRestart={() => {
                // Drop the user back at step 4 so they're already at the
                // diet/preferences screen ready to tweak — not at the start.
                setWizardStep(4);
                setState({ phase: "wizard" });
              }}
            />
          </div>
        )}
      </main>
      <Colophon />
    </div>
  );
}

function Masthead({ onStart }: { onStart: () => void }) {
  return (
    <header className="border-b border-foreground sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-5 sm:px-8 flex items-center justify-between py-3 gap-4">
        <a href="/" className="flex items-baseline gap-3 group min-w-0">
          <span className="font-display text-2xl font-medium tracking-tight leading-none italic">
            Dinemate
          </span>
          <span className="hidden sm:inline-block eyebrow text-foreground/45 truncate">
            Sid Subramanian · powered by Next.js
          </span>
        </a>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden lg:inline-flex items-center gap-2 eyebrow text-foreground/55">
            <span className="size-1.5 rounded-full bg-carolina" />
            For UNC Chapel Hill
          </span>
          <Button size="sm" onClick={onStart}>
            Begin
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="animate-fade-up">
      <Hero onStart={onStart} />
      <HowItWorks />
      <CampusPanel />
      <ClosingCTA onStart={onStart} />
    </div>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="border-b border-foreground">
      <div className="container mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 py-12 sm:py-20 items-center">
        <div className="lg:col-span-7 space-y-7">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-carolina" />
            <span className="eyebrow text-foreground/65">
              Welcome — Spring 2026 Issue
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-medium tracking-tight leading-[0.95]">
            Welcome to{" "}
            <span className="italic font-display-wonk">Dinemate</span>.
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed text-foreground/85 max-w-xl">
            A friendly meal-planning companion for UNC students. Tell us about
            your week and your goals — we&apos;ll match them to what&apos;s
            actually being served at the dining halls today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button onClick={onStart} size="lg" className="bg-carolina hover:bg-carolina/90 text-white">
              Build my plan
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
            <a
              href="#how-it-works"
              className="text-sm underline underline-offset-[5px] decoration-foreground/40 hover:decoration-foreground px-3 py-2 cursor-pointer"
            >
              How it works ↓
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground/60" />
              Real Carolina menus
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground/60" />
              Hits your macros
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground/60" />
              60-second setup
            </span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="image-treatment aspect-[4/5] sm:aspect-[3/4]">
            <Image
              src={HERO_FOOD.src}
              alt={HERO_FOOD.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="text-foreground/50">Photo</span>{" "}
            <a
              href={HERO_FOOD.creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              {HERO_FOOD.credit}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      numeral: "I.",
      title: "Tell us about you",
      body: "Age, height, weight, sex — and how active you are. Standard inputs for a Mifflin-St Jeor BMR estimate. Sixty seconds, four screens.",
      image: STEP_TELL_US,
    },
    {
      numeral: "II.",
      title: "We do the math",
      body: "We turn that into a daily target — calories, protein, carbs, fat — adjusted for your goal. The same arithmetic a registered dietitian would write down.",
      image: STEP_MATH,
    },
    {
      numeral: "III.",
      title: "Eat well at Lenoir & Chase",
      body: "We pick two-to-four real menu items per meal that land within ten percent of your target. Every gram pulled from Carolina Dining Services itself.",
      image: STEP_EAT,
    },
  ];

  return (
    <section id="how-it-works" className="border-b border-foreground bg-paper">
      <div className="container mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="eyebrow text-foreground/55">A quick tour</span>
            <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-tight leading-tight">
              Three steps. Honest math.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground italic max-w-sm">
            From your inputs to a real plate at Top of Lenoir or Chase.
          </p>
        </div>

        <div className="carolina-rule" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
          {steps.map((s) => (
            <article key={s.numeral} className="space-y-4">
              <div className="image-treatment aspect-[4/5]">
                <Image
                  src={s.image.src}
                  alt={s.image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="font-display italic text-2xl text-carolina-deep/60">
                {s.numeral}
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight leading-tight">
                {s.title}
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CampusPanel() {
  return (
    <section className="border-b border-foreground">
      <div className="container mx-auto px-5 sm:px-8 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-center">
        <div className="lg:col-span-6">
          <div className="image-treatment aspect-[5/4]">
            <Image
              src={UNC_OLD_WELL.src}
              alt={UNC_OLD_WELL.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="text-foreground/50">Photo</span>{" "}
            <a
              href={UNC_OLD_WELL.creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              {UNC_OLD_WELL.credit}
            </a>
          </div>
        </div>
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-carolina" />
            <span className="eyebrow text-foreground/65">
              Built for the Hill
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-tight leading-tight">
            Made for students between Lenoir and the Old Well.
          </h2>
          <p className="text-base sm:text-lg text-foreground/85 leading-relaxed">
            Dinemate started as a side project after a long stretch of
            wandering Top of Lenoir wondering if a calorie-tracking app could
            speak the dining hall&apos;s language. Now it does.
          </p>
          <p className="text-sm text-muted-foreground">
            Every dish, every gram of protein, every serving size pulled
            directly from{" "}
            <a
              href="https://dining.unc.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground hover:text-foreground"
            >
              dining.unc.edu
            </a>{" "}
            — Carolina Dining Services&apos; own nutrition database.
          </p>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="bg-carolina-deep text-paper">
      <div className="container mx-auto px-5 sm:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 items-end">
        <div className="lg:col-span-8 space-y-3">
          <span className="eyebrow text-paper/55">Ready when you are</span>
          <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-tight leading-tight">
            Your week, <span className="italic">composed</span>.
          </h2>
          <p className="text-paper/75 max-w-xl text-base sm:text-lg leading-relaxed">
            Build your first plan in about a minute. Free, no account, no
            email.
          </p>
        </div>
        <div className="lg:col-span-4 flex lg:justify-end">
          <Button
            onClick={onStart}
            size="lg"
            className="bg-carolina text-white hover:bg-carolina/90 border border-carolina"
          >
            Start with my numbers
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Colophon() {
  return (
    <footer className="border-t border-foreground mt-auto bg-background">
      <div className="container mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 sm:grid-cols-4 gap-6 text-xs text-muted-foreground">
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Dinemate
          </span>
          <span>By Sid Subramanian. Powered by Next.js.</span>
        </div>
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Source
          </span>
          <a
            href="https://dining.unc.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground hover:text-foreground"
          >
            dining.unc.edu
          </a>
        </div>
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Imagery
          </span>
          <span>
            Unsplash · Wikimedia Commons (
            <span className="italic">CC BY-SA</span>)
          </span>
        </div>
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Notice
          </span>
          <span>
            Independent project. Not affiliated with the University of North
            Carolina at Chapel Hill.
          </span>
        </div>
      </div>
    </footer>
  );
}
