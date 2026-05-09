"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StepDots } from "@/components/ui/Progress";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ChipToggle } from "@/components/ui/Checkbox";
import { usePreferences } from "@/lib/preferences";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  defaultFatPercent,
  defaultProteinPerKg,
  ftInToCm,
  lbToKg,
} from "@/lib/nutrition";
import {
  WIZARD_VITALS,
  WIZARD_EFFORT,
  WIZARD_GOAL,
  WIZARD_DIET,
  type RemoteImage,
} from "@/lib/images";
import type {
  ActivityLevel,
  Allergen,
  DietPreference,
  Goal,
  PlanResult,
  Sex,
  UserProfile,
} from "@/lib/types";

export interface FormState {
  age: number;
  sex: Sex;
  heightFt: number;
  heightIn: number;
  weightLb: number;
  activity: ActivityLevel | null;
  goal: Goal | null;
  diet: DietPreference;
  avoidAllergens: Allergen[];
}

export const DEFAULT_FORM: FormState = {
  age: 20,
  sex: "male",
  heightFt: 5,
  heightIn: 10,
  weightLb: 160,
  activity: null,
  goal: null,
  diet: "none",
  avoidAllergens: [],
};

interface Props {
  initialForm: FormState;
  initialStep?: number;
  onFormChange: (form: FormState) => void;
  onStepChange?: (step: number) => void;
  onComplete: (plan: PlanResult, profile: UserProfile) => void;
}

const ALLERGENS: { value: Allergen; label: string }[] = [
  { value: "egg", label: "Egg" },
  { value: "soy", label: "Soy" },
  { value: "wheat", label: "Wheat" },
  { value: "milk", label: "Milk" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish" },
  { value: "peanut", label: "Peanut" },
  { value: "tree_nuts", label: "Tree Nuts" },
  { value: "sesame", label: "Sesame" },
  { value: "gluten", label: "Gluten" },
];

interface StepMeta {
  id: number;
  name: string;
  image: RemoteImage;
  pullQuote: string;
  pullAttrib: string;
}

const STEPS: StepMeta[] = [
  {
    id: 1,
    name: "Vitals",
    image: WIZARD_VITALS,
    pullQuote:
      "BMR is the calorie cost of just being alive — no walking, no thinking, no scrolling.",
    pullAttrib: "Mifflin-St Jeor, 1990",
  },
  {
    id: 2,
    name: "Effort",
    image: WIZARD_EFFORT,
    pullQuote:
      "A moderately active week burns roughly 1.55× your basal rate. The numbers compound quickly.",
    pullAttrib: "Activity multipliers, NIH",
  },
  {
    id: 3,
    name: "Goal",
    image: WIZARD_GOAL,
    pullQuote:
      "A pound of fat is about 3,500 calories — a deficit of 500 a day for a week.",
    pullAttrib: "On caloric arithmetic",
  },
  {
    id: 4,
    name: "Diet",
    image: WIZARD_DIET,
    pullQuote:
      "The dining hall labels every dish for vegan, vegetarian, halal, gluten-free and the major allergens.",
    pullAttrib: "Carolina Dining Services",
  },
];

export function OnboardingWizard({
  initialForm,
  initialStep = 1,
  onFormChange,
  onStepChange,
  onComplete,
}: Props) {
  const [step, setStepLocal] = useState(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setFormLocal] = useState<FormState>(initialForm);
  const { prefs } = usePreferences();

  // Always update local + parent in event handlers (never inside an updater),
  // so React doesn't see a parent setState during a child render.
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    setFormLocal(next);
    onFormChange(next);
  };

  const setStep = (s: number) => {
    setStepLocal(s);
    onStepChange?.(s);
  };

  const next = () => setStep(Math.min(STEPS.length, step + 1));
  const back = () => setStep(Math.max(1, step - 1));

  const canAdvance = () => {
    if (step === 1)
      return (
        form.age > 0 &&
        form.weightLb > 0 &&
        form.heightFt + form.heightIn / 12 > 3
      );
    if (step === 2) return form.activity !== null;
    if (step === 3) return form.goal !== null;
    return true;
  };

  const buildProfile = (): UserProfile => {
    const goal = form.goal ?? "maintain";
    return {
      age: form.age,
      sex: form.sex,
      heightCm: ftInToCm(form.heightFt, form.heightIn),
      weightKg: lbToKg(form.weightLb),
      activity: form.activity ?? "moderate",
      goal,
      diet: form.diet,
      avoidAllergens: form.avoidAllergens,
      proteinPerKg: defaultProteinPerKg(goal),
      fatPercent: defaultFatPercent(goal),
    };
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const profile = buildProfile();
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, ratings: prefs.items }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed: ${res.status}`);
      }
      const plan = (await res.json()) as PlanResult;
      onComplete(plan, profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const meta = STEPS[step - 1];

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow text-foreground/60 inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-carolina" />
            Step {String(step).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </span>
          <span className="font-display italic text-base">{meta.name}</span>
        </div>
        <StepDots current={step} total={STEPS.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-8 items-start">
        {/* Form column */}
        <div className="lg:col-span-7 surface p-6 sm:p-10 animate-slide-in" key={step}>
          {step === 1 && (
            <div className="space-y-8">
              <header>
                <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
                  The vitals.
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We use Mifflin-St Jeor with your sex, height, weight and age
                  to estimate basal metabolic rate.
                </p>
              </header>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={14}
                    max={100}
                    value={form.age}
                    onChange={(e) =>
                      update("age", parseInt(e.target.value || "0"))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Biological sex</Label>
                  <SegmentedControl<Sex>
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ]}
                    value={form.sex}
                    onChange={(v) => update("sex", v)}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Height & weight</Label>
                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Input
                      id="ft"
                      type="number"
                      min={3}
                      max={8}
                      value={form.heightFt}
                      onChange={(e) =>
                        update("heightFt", parseInt(e.target.value || "0"))
                      }
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      feet
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Input
                      id="in"
                      type="number"
                      min={0}
                      max={11}
                      value={form.heightIn}
                      onChange={(e) =>
                        update("heightIn", parseInt(e.target.value || "0"))
                      }
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      inches
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Input
                      id="lb"
                      type="number"
                      min={70}
                      max={500}
                      value={form.weightLb}
                      onChange={(e) =>
                        update("weightLb", parseInt(e.target.value || "0"))
                      }
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      pounds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <header>
                <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
                  How hard are you moving?
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Pick the activity level that best matches your average week —
                  workouts, walking, the climb up Bell Tower hill.
                </p>
              </header>
              <SegmentedControl<ActivityLevel>
                layout="stack"
                options={(
                  ["sedentary", "light", "moderate", "very", "extreme"] as ActivityLevel[]
                ).map((v) => ({
                  value: v,
                  label: ACTIVITY_LABELS[v].split(" (")[0],
                  description: ACTIVITY_LABELS[v].split(" (")[1]?.replace(")", ""),
                }))}
                value={form.activity}
                onChange={(v) => update("activity", v)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <header>
                <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
                  What&apos;s the brief?
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We adjust your daily target ±500 calories for cutting or
                  bulking.
                </p>
              </header>
              <SegmentedControl<Goal>
                layout="grid"
                options={(
                  ["cut", "maintain", "lean-bulk", "bulk"] as Goal[]
                ).map((v) => ({
                  value: v,
                  label: GOAL_LABELS[v].split(" (")[0],
                  description: GOAL_LABELS[v].split(" (")[1]?.replace(")", ""),
                }))}
                value={form.goal}
                onChange={(v) => update("goal", v)}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <header>
                <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
                  Anything we should leave off the plate?
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We&apos;ll filter the menu accordingly. Skip if none apply.
                </p>
              </header>

              <div className="space-y-3">
                <Label>Diet</Label>
                <SegmentedControl<DietPreference>
                  layout="grid"
                  options={[
                    { value: "none", label: "No restrictions" },
                    { value: "vegetarian", label: "Vegetarian" },
                    { value: "vegan", label: "Vegan" },
                    { value: "halal", label: "Halal" },
                    { value: "made_without_gluten", label: "Gluten-free" },
                  ]}
                  value={form.diet}
                  onChange={(v) => update("diet", v)}
                />
              </div>

              <div className="space-y-3">
                <Label>Avoid allergens</Label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((a) => (
                    <ChipToggle
                      key={a.value}
                      label={a.label}
                      checked={form.avoidAllergens.includes(a.value)}
                      onChange={(checked) =>
                        update(
                          "avoidAllergens",
                          checked
                            ? [...form.avoidAllergens, a.value]
                            : form.avoidAllergens.filter((x) => x !== a.value)
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span className="eyebrow text-danger mr-2">Error</span>
              {error}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-3 pt-6 border-t border-foreground/15">
            <Button
              variant="link"
              size="sm"
              onClick={back}
              disabled={step === 1 || submitting}
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.5} />
              Back
            </Button>
            {step < STEPS.length ? (
              <Button onClick={next} disabled={!canAdvance()}>
                Continue
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={submitting}
                size="lg"
                className="bg-carolina hover:bg-carolina/90 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Composing your week
                  </>
                ) : (
                  <>
                    Build the plan
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Side panel — image + pull quote */}
        <aside
          className="lg:col-span-5 lg:sticky lg:top-20 animate-slide-in"
          key={`aside-${step}`}
        >
          <figure className="space-y-3">
            <div className="image-treatment aspect-[4/5]">
              <Image
                src={meta.image.src}
                alt={meta.image.alt}
                fill
                priority={step === 1}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <figcaption className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="text-foreground/50">Photo</span>{" "}
                <a
                  href={meta.image.creditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {meta.image.credit}
                </a>
              </div>
            </figcaption>
          </figure>

          <blockquote className="mt-6 border-l-2 border-carolina pl-4 py-1">
            <p className="font-display italic text-lg sm:text-xl leading-snug">
              &ldquo;{meta.pullQuote}&rdquo;
            </p>
            <footer className="mt-2 eyebrow text-foreground/55">
              — {meta.pullAttrib}
            </footer>
          </blockquote>
        </aside>
      </div>
    </div>
  );
}
