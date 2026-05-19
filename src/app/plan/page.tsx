"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile, useStoredPlan } from "@/lib/use-app-data";
import { PlanView } from "@/components/PlanView";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function PlanPage() {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { plan, setPlan, hydrated: planHydrated } = useStoredPlan();
  const ready = profileHydrated && planHydrated;

  // No profile? Bounce home so the wizard can run.
  useEffect(() => {
    if (ready && !profile) {
      router.replace("/");
    }
  }, [ready, profile, router]);

  if (!ready) {
    return <LoadingState />;
  }

  if (!profile) {
    return <LoadingState />;
  }

  if (!plan) {
    return <EmptyPlan />;
  }

  return (
    <div className="pb-16">
      <PlanView
        plan={plan}
        profile={profile}
        onPlanUpdate={setPlan}
        onRestart={() => router.push("/customize")}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-5 sm:px-8 py-24 flex items-center justify-center">
      <span className="eyebrow text-foreground/50">Loading your plan…</span>
    </div>
  );
}

function EmptyPlan() {
  return (
    <div className="container mx-auto px-5 sm:px-8 py-24 max-w-2xl space-y-6">
      <span className="eyebrow text-foreground/55">No plan yet</span>
      <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight">
        Your profile is here — but no plan has been generated.
      </h1>
      <p className="text-base text-foreground/80 leading-relaxed">
        Head back to the wizard to compose your week, or jump to Customize to
        edit your profile and trigger a rebuild.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/">
          <Button className="bg-carolina hover:bg-carolina/90 text-white">
            Build a plan
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Button>
        </Link>
        <Link href="/customize">
          <Button variant="outline">Open Customize</Button>
        </Link>
      </div>
    </div>
  );
}
