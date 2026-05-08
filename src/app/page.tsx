"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { PlanView } from "@/components/PlanView";
import type { PlanResult, UserProfile } from "@/lib/types";

type AppState =
  | { phase: "landing" }
  | { phase: "wizard" }
  | { phase: "plan"; plan: PlanResult; profile: UserProfile };

export default function Page() {
  const [state, setState] = useState<AppState>({ phase: "landing" });

  useEffect(() => {
    if (state.phase !== "landing") {
      window.scrollTo({ top: 0 });
    }
  }, [state.phase]);

  return (
    <div className="flex flex-col flex-1">
      <Masthead onStart={() => setState({ phase: "wizard" })} />
      <main className="flex-1">
        <div className="container mx-auto px-5 sm:px-8 py-10 sm:py-16">
          {state.phase === "landing" && (
            <Landing onStart={() => setState({ phase: "wizard" })} />
          )}
          {state.phase === "wizard" && (
            <OnboardingWizard
              onComplete={(plan, profile) =>
                setState({ phase: "plan", plan, profile })
              }
            />
          )}
          {state.phase === "plan" && (
            <PlanView
              plan={state.plan}
              onRestart={() => setState({ phase: "wizard" })}
            />
          )}
        </div>
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
          <span className="hidden lg:inline-block eyebrow text-foreground/45">
            For students of UNC Chapel Hill
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
    <div className="max-w-6xl mx-auto animate-fade-up space-y-16 sm:space-y-24">
      {/* Hero — editorial split */}
      <section className="space-y-8">
        <div className="rule-double" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10 items-end">
          <div className="lg:col-span-8">
            <div className="eyebrow text-foreground/55 mb-5">
              Issue · Spring 2026
            </div>
            <h1 className="font-display text-[2.75rem] sm:text-7xl lg:text-[6rem] font-medium leading-[0.92] tracking-tight">
              The plate,<br />
              <span className="italic font-display-wonk">programmed.</span>
            </h1>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <p className="text-base sm:text-lg leading-relaxed text-foreground/85">
              An honest meal planner for UNC Chapel Hill — built from real
              Carolina Dining Services menus, tuned to your daily numbers.
            </p>
            <Button onClick={onStart} size="lg">
              Compose my week
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        <div className="rule" />
      </section>

      {/* By the numbers */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-foreground/15 border-y border-foreground/15">
          <Figure value="1,745" label="Menu items indexed" />
          <Figure value="2" label="All-you-care halls" />
          <Figure value="402" label="Unique recipes" />
          <Figure value="7" label="Days per plan" />
        </div>
      </section>

      {/* Three columns — like a feature spread */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-12">
        <Article
          numeral="I."
          title="Calculate"
          subhead="Mifflin-St Jeor BMR multiplied by an honest activity factor, adjusted for your goal. The same arithmetic a registered dietitian would write down."
        />
        <Article
          numeral="II."
          title="Compose"
          subhead="A greedy optimizer picks two-to-four dishes per meal that land within ten percent of your daily protein and calorie target — across breakfast, lunch and dinner."
        />
        <Article
          numeral="III."
          title="Carry it"
          subhead="Open the plan from your phone in line at Lenoir or Chase. Skip what doesn't suit; we kept the math simple so you can swap with confidence."
        />
      </section>

      {/* Method */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 border-t border-foreground pt-10">
        <div className="lg:col-span-4">
          <div className="eyebrow text-foreground/55 mb-2">A note on method</div>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
            We&apos;re not <span className="italic">guessing</span>.
          </h2>
        </div>
        <div className="lg:col-span-8 space-y-4 text-foreground/85 leading-relaxed">
          <p>
            Every dish, every calorie, every gram of protein in your plan comes
            directly from{" "}
            <a
              href="https://dining.unc.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground"
            >
              dining.unc.edu
            </a>{" "}
            — the same nutrition database the dining hall publishes for
            students, scraped overnight and cached.
          </p>
          <p className="text-sm text-muted-foreground">
            Dinemate is an independent project by Sid Subramanian, built with
            Next.js. Not affiliated with the University of North Carolina at
            Chapel Hill or Carolina Dining Services. Calorie estimates are
            provided for general guidance, not medical advice.
          </p>
        </div>
      </section>
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-6 sm:py-8">
      <div className="font-display text-3xl sm:text-5xl font-medium tracking-tight leading-none tabular-nums">
        {value}
      </div>
      <div className="eyebrow text-foreground/55 mt-3">{label}</div>
    </div>
  );
}

function Article({
  numeral,
  title,
  subhead,
}: {
  numeral: string;
  title: string;
  subhead: string;
}) {
  return (
    <article className="space-y-3">
      <div className="font-display italic text-2xl text-foreground/40">
        {numeral}
      </div>
      <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight leading-tight">
        {title}
      </h3>
      <p className="text-sm text-foreground/80 leading-relaxed">{subhead}</p>
    </article>
  );
}

function Colophon() {
  return (
    <footer className="border-t border-foreground mt-auto">
      <div className="container mx-auto px-5 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div>
          <span className="eyebrow text-foreground/60 block mb-1">
            Dinemate
          </span>
          <span>By Sid Subramanian. Powered by Next.js.</span>
        </div>
        <div>
          <span className="eyebrow text-foreground/60 block mb-1">Source</span>
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
          <span className="eyebrow text-foreground/60 block mb-1">Notice</span>
          <span>Estimates for guidance, not medical advice.</span>
        </div>
      </div>
    </footer>
  );
}
