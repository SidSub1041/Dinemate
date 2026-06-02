"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useProfile, useStoredPlan } from "@/lib/use-app-data";
import { PlanView } from "@/components/PlanView";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import menuData from "@/data/menu.json";
import {
  buildRecipeLocationIndex,
  isPlanStale,
} from "@/lib/plan-validation";
import type { MenuData, PlanResult } from "@/lib/types";

export default function PlanPage() {
  const router = useRouter();
  const { status } = useSession();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { plan, setPlan, hydrated: planHydrated } = useStoredPlan();
  const ready = profileHydrated && planHydrated;
  const [bootstrapWindowClosed, setBootstrapWindowClosed] = useState(false);
  const [silentRebuilding, setSilentRebuilding] = useState(false);
  // Latch — never auto-rebuild more than once per page mount even if the
  // rebuilt plan also somehow looks stale.
  const autoRebuiltRef = useRef(false);

  // Give the SyncManager up to 4 seconds to populate localStorage from the
  // server before we give up and assume the user truly has no plan yet.
  useEffect(() => {
    if (status !== "authenticated") return;
    const t = setTimeout(() => setBootstrapWindowClosed(true), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // Auth gate: anonymous users go to /signin. Otherwise:
  //   - if hydrated and we have no profile, wait for bootstrap; after the
  //     window closes, send them home (the landing handles the wizard).
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (!ready) return;
    if (profile) return;
    if (status === "authenticated" && !bootstrapWindowClosed) return;
    router.replace("/");
  }, [ready, profile, status, bootstrapWindowClosed, router]);

  // Self-heal pre-fix plans. If any meal has items from multiple
  // locations (the bug that gave us "Chick-fil-A" with a Subway sub on
  // the same card), POST the profile back to /api/plan and replace the
  // stored snapshot with a fresh, single-location-per-meal version.
  // Silent on purpose: this is a back-fill, not a user action.
  useEffect(() => {
    if (!ready) return;
    if (!profile || !plan) return;
    if (autoRebuiltRef.current) return;
    const idx = buildRecipeLocationIndex(menuData as MenuData);
    if (!isPlanStale(plan, idx)) return;
    autoRebuiltRef.current = true;
    setSilentRebuilding(true);
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<PlanResult>) : null))
      .then((next) => {
        if (next) setPlan(next);
      })
      .catch(() => {
        // Silent failure is fine — user can click "Rebuild week" manually.
      })
      .finally(() => setSilentRebuilding(false));
  }, [ready, profile, plan, setPlan]);

  // While authenticated and waiting on bootstrap, show a loading shell.
  if (!ready || (status === "authenticated" && !profile && !bootstrapWindowClosed)) {
    return <LoadingState />;
  }

  if (!profile) {
    return <LoadingState />;
  }

  if (!plan || silentRebuilding) {
    return <LoadingState />;
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
