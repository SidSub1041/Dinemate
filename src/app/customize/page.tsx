"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  X,
  ChefHat,
  Sliders,
  Heart,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  useProfile,
  useStoredPlan,
  useCustomMeals,
  type CustomMeal,
} from "@/lib/use-app-data";
import { usePreferences } from "@/lib/preferences";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  calculateTargets,
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
} from "@/lib/nutrition";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ChipToggle } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";
import type {
  ActivityLevel,
  Allergen,
  DietPreference,
  Goal,
  PlanResult,
  Sex,
  UserProfile,
} from "@/lib/types";

type Section = "profile" | "habits" | "library" | "ratings";

const SECTIONS: { id: Section; label: string; icon: typeof Sliders }[] = [
  { id: "profile", label: "Profile", icon: Sliders },
  { id: "habits", label: "Habits", icon: CalendarIcon },
  { id: "library", label: "Library", icon: ChefHat },
  { id: "ratings", label: "Ratings", icon: Heart },
];

export default function CustomizePage() {
  const router = useRouter();
  const { status } = useSession();
  const { profile, setProfile, hydrated: profileHydrated } = useProfile();
  const { setPlan } = useStoredPlan();
  const [section, setSection] = useState<Section>("profile");
  const [bootstrapWindowClosed, setBootstrapWindowClosed] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const t = setTimeout(() => setBootstrapWindowClosed(true), 4000);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (!profileHydrated) return;
    if (profile) return;
    if (status === "authenticated" && !bootstrapWindowClosed) return;
    router.replace("/");
  }, [profileHydrated, profile, status, bootstrapWindowClosed, router]);

  if (
    !profileHydrated ||
    (status === "authenticated" && !profile && !bootstrapWindowClosed)
  ) {
    return (
      <div className="container mx-auto px-5 sm:px-8 py-24 text-center">
        <span className="eyebrow text-foreground/50">Loading…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-5 sm:px-8 py-24 text-center">
        <span className="eyebrow text-foreground/50">Loading…</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 sm:px-8 py-10 sm:py-14 max-w-5xl space-y-10">
      <header className="space-y-3">
        <div className="rule-double" />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2">
          <div>
            <span className="eyebrow text-foreground/60">Settings · Synced</span>
            <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] text-6xl sm:text-8xl leading-[0.88]">
              Dial it <span className="text-carolina">in.</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground italic max-w-sm">
            Edit anything, then head back to your plan to rebuild.
          </p>
        </div>
        <div className="rule" />
      </header>

      <nav className="flex flex-wrap gap-0 -mt-px border border-foreground">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium tracking-tight border-r border-foreground last:border-r-0 transition-colors cursor-pointer",
                active
                  ? "bg-foreground text-paper"
                  : "bg-paper text-foreground hover:bg-foreground/5",
                i === 0 ? "" : "-ml-px"
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.5} />
              {s.label}
            </button>
          );
        })}
      </nav>

      <div className="animate-slide-in" key={section}>
        {section === "profile" && (
          <ProfileEditor
            profile={profile}
            onSave={(next) => setProfile(next)}
            onRebuilt={(plan) => {
              setPlan(plan);
              router.push("/plan");
            }}
          />
        )}
        {section === "habits" && (
          <HabitsEditor
            profile={profile}
            onSave={(next) => setProfile(next)}
          />
        )}
        {section === "library" && <LibraryEditor />}
        {section === "ratings" && <RatingsOverview />}
      </div>
    </div>
  );
}

// =================================================================
// Profile editor
// =================================================================

function ProfileEditor({
  profile,
  onSave,
  onRebuilt,
}: {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onRebuilt: (plan: PlanResult) => void;
}) {
  const initialHeight = cmToFtIn(profile.heightCm);
  const [age, setAge] = useState(profile.age);
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [heightFt, setHeightFt] = useState(initialHeight.ft);
  const [heightIn, setHeightIn] = useState(initialHeight.inches);
  const [weightLb, setWeightLb] = useState(Math.round(kgToLb(profile.weightKg)));
  const [activity, setActivity] = useState<ActivityLevel>(profile.activity);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [diet, setDiet] = useState<DietPreference>(profile.diet);
  const [allergens, setAllergens] = useState<Allergen[]>(
    profile.avoidAllergens
  );
  const [proteinPerKg, setProteinPerKg] = useState(profile.proteinPerKg);
  const [fatPercent, setFatPercent] = useState(profile.fatPercent);
  const [rebuilding, setRebuilding] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const buildUpdated = (): UserProfile => ({
    age,
    sex,
    heightCm: ftInToCm(heightFt, heightIn),
    weightKg: lbToKg(weightLb),
    activity,
    goal,
    diet,
    avoidAllergens: allergens,
    proteinPerKg,
    fatPercent,
    habits: profile.habits,
  });

  const targets = calculateTargets(buildUpdated());

  const handleSave = () => {
    onSave(buildUpdated());
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  const handleSaveAndRebuild = async () => {
    setRebuilding(true);
    try {
      const next = buildUpdated();
      onSave(next);
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next, ratings: {} }),
      });
      if (!res.ok) throw new Error("Rebuild failed");
      const plan = (await res.json()) as PlanResult;
      onRebuilt(plan);
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <section className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label>Age</Label>
              <Input
                type="number"
                min={14}
                max={100}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value || "0"))}
              />
            </div>
            <div className="space-y-2">
              <Label>Biological sex</Label>
              <SegmentedControl<Sex>
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
                value={sex}
                onChange={setSex}
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Height & weight</Label>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <Input
                  type="number"
                  min={3}
                  max={8}
                  value={heightFt}
                  onChange={(e) =>
                    setHeightFt(parseInt(e.target.value || "0"))
                  }
                />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  feet
                </span>
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  min={0}
                  max={11}
                  value={heightIn}
                  onChange={(e) =>
                    setHeightIn(parseInt(e.target.value || "0"))
                  }
                />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  inches
                </span>
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  min={70}
                  max={500}
                  value={weightLb}
                  onChange={(e) =>
                    setWeightLb(parseInt(e.target.value || "0"))
                  }
                />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  pounds
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Activity level</Label>
            <SegmentedControl<ActivityLevel>
              layout="stack"
              options={(
                ["sedentary", "light", "moderate", "very", "extreme"] as ActivityLevel[]
              ).map((v) => ({
                value: v,
                label: ACTIVITY_LABELS[v].split(" (")[0],
                description: ACTIVITY_LABELS[v]
                  .split(" (")[1]
                  ?.replace(")", ""),
              }))}
              value={activity}
              onChange={setActivity}
            />
          </div>

          <div className="space-y-3">
            <Label>Goal</Label>
            <SegmentedControl<Goal>
              layout="grid"
              options={(
                ["cut", "maintain", "lean-bulk", "bulk"] as Goal[]
              ).map((v) => ({
                value: v,
                label: GOAL_LABELS[v].split(" (")[0],
                description: GOAL_LABELS[v].split(" (")[1]?.replace(")", ""),
              }))}
              value={goal}
              onChange={setGoal}
            />
          </div>

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
              value={diet}
              onChange={setDiet}
            />
          </div>

          <div className="space-y-3">
            <Label>Avoid allergens</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["egg", "Egg"],
                  ["soy", "Soy"],
                  ["wheat", "Wheat"],
                  ["milk", "Milk"],
                  ["fish", "Fish"],
                  ["shellfish", "Shellfish"],
                  ["peanut", "Peanut"],
                  ["tree_nuts", "Tree Nuts"],
                  ["sesame", "Sesame"],
                  ["gluten", "Gluten"],
                ] as [Allergen, string][]
              ).map(([value, label]) => (
                <ChipToggle
                  key={value}
                  label={label}
                  checked={allergens.includes(value)}
                  onChange={(c) =>
                    setAllergens((prev) =>
                      c ? [...prev, value] : prev.filter((x) => x !== value)
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label>Protein per kg bodyweight</Label>
              <Input
                type="number"
                step="0.1"
                min={0.8}
                max={3.5}
                value={proteinPerKg}
                onChange={(e) =>
                  setProteinPerKg(parseFloat(e.target.value || "0"))
                }
              />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                grams of protein / kg
              </span>
            </div>
            <div className="space-y-2">
              <Label>Calories from fat</Label>
              <Input
                type="number"
                step="0.05"
                min={0.15}
                max={0.5}
                value={fatPercent}
                onChange={(e) =>
                  setFatPercent(parseFloat(e.target.value || "0"))
                }
              />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                fraction (0.25–0.35 typical)
              </span>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5 space-y-4">
          <div className="surface-soft p-5 space-y-4">
            <span className="eyebrow text-foreground/55">Live targets</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-display tabular-nums">
              <Stat label="kcal" value={targets.calories} />
              <Stat label="protein" value={`${targets.proteinG} g`} />
              <Stat label="carbs" value={`${targets.carbsG} g`} />
              <Stat label="fat" value={`${targets.fatG} g`} />
            </div>
            <div className="text-xs text-muted-foreground font-mono-tabular space-x-3">
              <span>
                <span className="eyebrow text-foreground/45 mr-1">BMR</span>
                {targets.bmr}
              </span>
              <span>
                <span className="eyebrow text-foreground/45 mr-1">TDEE</span>
                {targets.tdee}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground italic leading-relaxed">
            Changing height, weight, activity, or goal shifts these numbers.
            Save the profile to keep them — or save and rebuild to apply across
            all seven days at once.
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-foreground/15">
        <Button onClick={handleSave} variant="secondary">
          Save profile
        </Button>
        <Button
          onClick={handleSaveAndRebuild}
          disabled={rebuilding}
          className="bg-carolina hover:bg-carolina/90 text-white"
        >
          {rebuilding ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Rebuilding
            </>
          ) : (
            <>
              Save & rebuild week
              <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </>
          )}
        </Button>
        {savedAt && (
          <span className="text-xs text-success animate-fade-up">
            Saved.
          </span>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-3xl font-medium tracking-tight leading-none">
        {value}
      </div>
      <div className="eyebrow text-foreground/55 mt-1">{label}</div>
    </div>
  );
}

// =================================================================
// Habits editor
// =================================================================

function HabitsEditor({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}) {
  type Mealset = ("breakfast" | "lunch" | "dinner")[];
  const [meals, setMeals] = useState<Mealset>(
    (profile.habits?.mealsOnCampus as Mealset) ?? [
      "breakfast",
      "lunch",
      "dinner",
    ]
  );
  const [frequency, setFrequency] = useState(
    profile.habits?.weeklyCampusMeals ?? "most"
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSave = () => {
    onSave({
      ...profile,
      habits: {
        mealsOnCampus: meals.length ? meals : ["breakfast", "lunch", "dinner"],
        weeklyCampusMeals: frequency,
      },
    });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  return (
    <section className="space-y-8 max-w-2xl">
      <div className="space-y-3">
        <Label>Meals you usually eat on campus</Label>
        <div className="flex flex-wrap gap-2">
          {(["breakfast", "lunch", "dinner"] as const).map((m) => (
            <ChipToggle
              key={m}
              label={m.charAt(0).toUpperCase() + m.slice(1)}
              checked={meals.includes(m)}
              onChange={(c) =>
                setMeals((prev) =>
                  c ? [...prev, m] : prev.filter((x) => x !== m)
                )
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Frequency</Label>
        <SegmentedControl
          layout="grid"
          options={[
            { value: "few", label: "A few times", description: "Mostly off-campus" },
            { value: "some", label: "Half the week", description: "Some weekdays" },
            { value: "most", label: "Most days", description: "Default for residents" },
            { value: "all", label: "Every slot", description: "On-plan as possible" },
          ]}
          value={frequency}
          onChange={(v) => setFrequency(v as typeof frequency)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-foreground/15">
        <Button
          onClick={handleSave}
          className="bg-carolina hover:bg-carolina/90 text-white"
        >
          Save habits
        </Button>
        {savedAt && <span className="text-xs text-success">Saved.</span>}
      </div>
    </section>
  );
}

// =================================================================
// Custom meals library
// =================================================================

function LibraryEditor() {
  const { meals, add, update, remove } = useCustomMeals();
  const [editing, setEditing] = useState<CustomMeal | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-8">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-sm text-foreground/80 max-w-xl leading-relaxed">
          Save the meals you actually eat — homemade dinners, favorite
          takeout, your usual coffee shop sandwich. Anything in the library
          becomes available as a one-tap swap on the Plan page.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          className="bg-carolina hover:bg-carolina/90 text-white"
        >
          <Plus className="size-3.5" strokeWidth={1.5} />
          New meal
        </Button>
      </div>

      {(adding || editing) && (
        <MealForm
          initial={editing ?? undefined}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSubmit={(meal) => {
            if (editing) {
              update(editing.id, meal);
            } else {
              add(meal);
            }
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      {meals.length === 0 ? (
        <div className="border border-foreground/15 px-5 py-12 text-center text-sm text-muted-foreground italic">
          Your library is empty. Add a meal to start swapping it into your
          plan.
        </div>
      ) : (
        <ul className="border border-foreground divide-y divide-foreground/10">
          {meals.map((m) => (
            <li
              key={m.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm tracking-tight">
                  {m.name}
                </div>
                <div className="text-[11px] text-muted-foreground italic">
                  {m.source === "homemade" ? "Homemade" : m.source === "restaurant" ? `Restaurant · ${m.station || "—"}` : m.station || "Custom"}
                </div>
              </div>
              <div className="text-xs font-mono-tabular text-foreground/70 tabular-nums shrink-0">
                {m.calories} kcal · P{m.proteinG} C{m.carbsG} F{m.fatG}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(m);
                    setAdding(false);
                  }}
                  className="p-1.5 text-foreground/60 hover:text-foreground border border-foreground/30 hover:border-foreground cursor-pointer transition-colors"
                  title="Edit"
                >
                  <Pencil className="size-3" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="p-1.5 text-foreground/60 hover:text-danger border border-foreground/30 hover:border-danger cursor-pointer transition-colors"
                  title="Remove"
                >
                  <Trash2 className="size-3" strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MealForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: CustomMeal;
  onCancel: () => void;
  onSubmit: (meal: Omit<CustomMeal, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [source, setSource] = useState<CustomMeal["source"]>(
    initial?.source ?? "homemade"
  );
  const [station, setStation] = useState(initial?.station ?? "");
  const [calories, setCalories] = useState(initial?.calories ?? 0);
  const [proteinG, setProteinG] = useState(initial?.proteinG ?? 0);
  const [carbsG, setCarbsG] = useState(initial?.carbsG ?? 0);
  const [fatG, setFatG] = useState(initial?.fatG ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [diets, setDiets] = useState<DietPreference[]>(initial?.diets ?? []);
  const [allergens, setAllergens] = useState<Allergen[]>(
    initial?.allergens ?? []
  );

  const valid = name.trim().length > 0 && calories > 0;

  return (
    <div className="surface p-5 sm:p-6 space-y-6 animate-slide-in">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow text-foreground/60">
          {initial ? "Edit meal" : "New meal"}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] eyebrow text-foreground/55 hover:text-foreground cursor-pointer inline-flex items-center gap-1"
        >
          <X className="size-3" strokeWidth={1.5} />
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={name}
            placeholder="e.g. Grandma's chicken parm"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <SegmentedControl<CustomMeal["source"]>
            options={[
              { value: "homemade", label: "Homemade" },
              { value: "restaurant", label: "Restaurant" },
              { value: "other", label: "Other" },
            ]}
            value={source}
            onChange={setSource}
          />
        </div>
        {source !== "homemade" && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Place / station</Label>
            <Input
              value={station}
              placeholder={
                source === "restaurant" ? "Cookout, Sup Dogs, …" : "Optional"
              }
              onChange={(e) => setStation(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <NumField label="kcal" value={calories} onChange={setCalories} />
        <NumField label="protein (g)" value={proteinG} onChange={setProteinG} />
        <NumField label="carbs (g)" value={carbsG} onChange={setCarbsG} />
        <NumField label="fat (g)" value={fatG} onChange={setFatG} />
      </div>

      <div className="space-y-3">
        <Label>Diets</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["vegetarian", "Vegetarian"],
              ["vegan", "Vegan"],
              ["halal", "Halal"],
              ["made_without_gluten", "GF"],
            ] as [DietPreference, string][]
          ).map(([value, label]) => (
            <ChipToggle
              key={value}
              label={label}
              checked={diets.includes(value)}
              onChange={(c) =>
                setDiets((prev) =>
                  c ? [...prev, value] : prev.filter((x) => x !== value)
                )
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Allergens (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["egg", "Egg"],
              ["soy", "Soy"],
              ["wheat", "Wheat"],
              ["milk", "Milk"],
              ["fish", "Fish"],
              ["shellfish", "Shellfish"],
              ["peanut", "Peanut"],
              ["tree_nuts", "Tree Nuts"],
              ["sesame", "Sesame"],
              ["gluten", "Gluten"],
            ] as [Allergen, string][]
          ).map(([value, label]) => (
            <ChipToggle
              key={value}
              label={label}
              checked={allergens.includes(value)}
              onChange={(c) =>
                setAllergens((prev) =>
                  c ? [...prev, value] : prev.filter((x) => x !== value)
                )
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional — recipe link, prep notes, etc."
          className="w-full min-h-[60px] border-0 border-b border-foreground/30 bg-transparent py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground focus:border-b-2"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() =>
            onSubmit({
              name: name.trim(),
              source,
              station,
              calories,
              proteinG,
              carbsG,
              fatG,
              diets,
              allergens,
              notes: notes.trim() || undefined,
            })
          }
          disabled={!valid}
          className="bg-carolina hover:bg-carolina/90 text-white"
        >
          {initial ? "Save changes" : "Add to library"}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-foreground/60 hover:text-foreground underline underline-offset-4 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
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
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0")))}
      />
    </div>
  );
}

// =================================================================
// Ratings overview
// =================================================================

function RatingsOverview() {
  const { prefs, setRating, clear, hydrated } = usePreferences();
  if (!hydrated) {
    return (
      <div className="text-sm text-muted-foreground italic">Loading…</div>
    );
  }
  const entries = Object.entries(prefs.items);
  const loved = entries.filter(([, r]) => r === "love");
  const hated = entries.filter(([, r]) => r === "hate");

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <RatingsCard
          title="Loved"
          ids={loved.map(([id]) => id)}
          empty="You haven't loved anything yet. Use the 👍 on the Plan page to start teaching the optimizer."
          onUnrate={(id) => setRating(id, null)}
          accent="bg-carolina"
        />
        <RatingsCard
          title="Skipped"
          ids={hated.map(([id]) => id)}
          empty="Nothing flagged to skip. 👎 on the Plan page hides an item completely."
          onUnrate={(id) => setRating(id, null)}
          accent="bg-foreground"
        />
      </div>
      {entries.length > 0 && (
        <div className="pt-4 border-t border-foreground/15">
          <button
            type="button"
            onClick={clear}
            className="text-xs eyebrow text-foreground/55 hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            Clear all ratings
          </button>
        </div>
      )}
    </section>
  );
}

function RatingsCard({
  title,
  ids,
  empty,
  onUnrate,
  accent,
}: {
  title: string;
  ids: string[];
  empty: string;
  onUnrate: (id: string) => void;
  accent: string;
}) {
  return (
    <div className="surface-soft p-5 space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow text-foreground/60 inline-flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", accent)} />
          {title}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {ids.length}
        </span>
      </div>
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          {empty}
        </p>
      ) : (
        <ul className="space-y-1">
          {ids.slice(0, 40).map((id) => (
            <li
              key={id}
              className="flex items-center justify-between gap-2 py-1.5 border-b border-foreground/5 last:border-0"
            >
              <span className="text-xs font-mono-tabular text-foreground/80 truncate">
                {id}
              </span>
              <button
                type="button"
                onClick={() => onUnrate(id)}
                className="text-[10px] eyebrow text-foreground/55 hover:text-foreground cursor-pointer underline underline-offset-4"
              >
                Clear
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
