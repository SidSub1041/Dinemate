"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function SignUpPage() {
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
    const name = String(data.get("name") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    startTransition(async () => {
      // Step 1: server creates the user (POST /api/auth/signup) and hashes
      // the password. Step 2: client signs in to keep the session cache fresh.
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: "Signup failed." }));
        setError(body.error ?? "Signup failed.");
        return;
      }
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Signed up but couldn't sign in automatically. Please try signing in.");
        return;
      }
      window.location.href = "/plan";
    });
  };

  return (
    <div className="container mx-auto px-5 sm:px-8 py-14 sm:py-20 max-w-md">
      <div className="rule-double mb-8" />
      <span className="eyebrow text-foreground/55">Create an account</span>
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] text-5xl sm:text-6xl leading-[0.9] mt-3">
        Keep your
        <br />
        <span className="text-carolina">week.</span>
      </h1>
      <p className="text-sm text-foreground/75 mt-4 leading-relaxed">
        Sign up to sync your profile, plan, library and ratings to any
        device. Anything in your browser right now comes with you on the
        first sign-in.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Sid"
            autoComplete="name"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={10}
          />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            At least 10 characters
          </p>
        </div>

        {error && (
          <div className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            <span className="eyebrow text-danger mr-2">Error</span>
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between gap-3">
          <Link
            href="/signin"
            className="text-sm text-foreground/65 hover:text-foreground underline underline-offset-4 decoration-foreground/30"
          >
            Already have an account?
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
                Creating
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="mt-10 text-[11px] text-muted-foreground italic leading-relaxed">
        Your password is hashed with bcrypt (12 rounds) and never leaves the
        server. We don&apos;t share, sell, or advertise to your account.
      </p>
    </div>
  );
}
