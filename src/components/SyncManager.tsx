"use client";

/**
 * Bridges localStorage and the server-side account snapshot.
 *
 *   - On sign-in, POST /api/account/state. If the server is empty and the
 *     local cache has data, the server adopts the local snapshot
 *     (one-time migration). If the server already has data, the response
 *     contains the server-canonical snapshot which overwrites localStorage.
 *   - While signed in, every same-tab change to a Dinemate localStorage
 *     key fires a custom "dinemate:storage" event. We debounce 1.5s and
 *     PUT the whole snapshot.
 *   - On sign-out, localStorage is left alone so anonymous mode keeps
 *     working on the same device.
 *
 * Hydration loop avoidance: writes triggered by `bootstrap()` happen
 * within a ~500ms suppression window so they don't immediately bounce
 * back to the server.
 */

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { STORAGE_KEYS, readStored } from "@/lib/storage";
import {
  EMPTY_ACCOUNT_STATE,
  type AccountState,
} from "@/lib/account-state";

const SUPPRESS_WINDOW_MS = 800;
const DEBOUNCE_MS = 1500;

function readClientState(): AccountState {
  return {
    profile: readStored(STORAGE_KEYS.profile, EMPTY_ACCOUNT_STATE.profile),
    plan: readStored(STORAGE_KEYS.plan, EMPTY_ACCOUNT_STATE.plan),
    customMeals: readStored(
      STORAGE_KEYS.customMeals,
      EMPTY_ACCOUNT_STATE.customMeals
    ),
    eaten: readStored(STORAGE_KEYS.eaten, EMPTY_ACCOUNT_STATE.eaten),
    ratings: readStored(
      STORAGE_KEYS.preferences,
      EMPTY_ACCOUNT_STATE.ratings
    ),
  };
}

function writeClientState(state: AccountState) {
  if (typeof window === "undefined") return;
  const write = (key: string, value: unknown) => {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  };
  write(STORAGE_KEYS.profile, state.profile);
  write(STORAGE_KEYS.plan, state.plan);
  write(STORAGE_KEYS.customMeals, state.customMeals);
  write(STORAGE_KEYS.eaten, state.eaten);
  write(STORAGE_KEYS.preferences, state.ratings);
  // Single broadcast so consumers refresh once after the bulk write.
  window.dispatchEvent(
    new CustomEvent("dinemate:storage", { detail: { key: "*" } })
  );
}

async function bootstrap(): Promise<void> {
  const local = readClientState();
  const res = await fetch("/api/account/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(local),
  });
  if (!res.ok) return;
  const server = (await res.json()) as AccountState;
  writeClientState(server);
}

async function pushSnapshot(): Promise<void> {
  const local = readClientState();
  try {
    await fetch("/api/account/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(local),
    });
  } catch {
    /* network blip — next change will retry */
  }
}

export function SyncManager() {
  const { status } = useSession();
  const bootstrapped = useRef(false);
  const lastSyncAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bootstrap exactly once per sign-in.
  useEffect(() => {
    if (status === "authenticated" && !bootstrapped.current) {
      bootstrapped.current = true;
      lastSyncAt.current = Date.now();
      bootstrap()
        .then(() => {
          lastSyncAt.current = Date.now();
        })
        .catch(() => {
          // If bootstrap fails (network) we'll retry on next change anyway.
        });
    } else if (status === "unauthenticated") {
      bootstrapped.current = false;
    }
  }, [status]);

  // Debounced push on every local change while signed in.
  useEffect(() => {
    if (status !== "authenticated") return;
    const onChange = () => {
      // Ignore hydration echoes that fire right after bootstrap writes.
      if (Date.now() - lastSyncAt.current < SUPPRESS_WINDOW_MS) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        lastSyncAt.current = Date.now();
        pushSnapshot();
      }, DEBOUNCE_MS);
    };
    window.addEventListener("dinemate:storage", onChange);
    return () => {
      window.removeEventListener("dinemate:storage", onChange);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [status]);

  return null;
}
