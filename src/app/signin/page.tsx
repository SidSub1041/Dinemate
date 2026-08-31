"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function SignInPage() {
  const router = useRouter();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (status === "authenticated") router.replace("/plan");
  }, [status, router]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    startTransition(async () => {
      // Client-side signIn keeps the SessionProvider cache in sync. The
      // server action variant left useSession stale until the next poll.
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Invalid email or password.");
        return;
      }
      // Hard refresh so layout-level providers re-hydrate against the
      // fresh session cookie before the destination mounts.
      window.location.href = "/plan";
    });
  };

  return (
    <div className="container mx-auto px-5 sm:px-8 py-14 sm:py-20 max-w-md">
      <div className="rule-double mb-8" />
      <span className="eyebrow text-foreground/55">Welcome back</span>
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] text-5xl sm:text-6xl leading-[0.9] mt-3">
        Welcome <span className="text-carolina">back.</span>
      </h1>
      <p className="text-sm text-foreground/75 mt-4 leading-relaxed">
        Your plan, library and ratings are waiting.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@unc.edu"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            <span className="eyebrow text-danger mr-2">Error</span>
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between gap-3">
          <Link
            href="/signup"
            className="text-sm text-foreground/65 hover:text-foreground underline underline-offset-4 decoration-foreground/30"
          >
            Need an account?
          </Link>
          <Button
            type="submit"
            disabled={pending}
            size="lg"
            className="bg-carolina hover:bg-carolina/90 text-white"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
