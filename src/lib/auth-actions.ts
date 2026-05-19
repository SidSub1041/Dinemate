"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError as NextAuthError } from "next-auth";
import { db } from "./db";
import { signIn, signOut, BCRYPT_ROUNDS } from "@/auth";

/** Returned by sign-up / sign-in actions when something goes wrong. */
export type AuthActionError = {
  error: string;
};

const signUpSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(120).optional(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200),
});

export async function signUpAction(
  formData: FormData
): Promise<AuthActionError | void> {
  const raw = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? "").trim() || undefined,
    password: String(formData.get("password") ?? ""),
  };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }
  const { email, name, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await db.user.create({
    data: { email, name, hashedPassword },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/plan",
    });
  } catch (e) {
    // NextAuth throws a redirect-style error on success; re-throw so Next
    // can perform the navigation.
    throw e;
  }
}

export async function signInAction(
  formData: FormData
): Promise<AuthActionError | void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/plan",
    });
  } catch (e) {
    if (e instanceof NextAuthError) {
      return { error: "Invalid email or password." };
    }
    throw e;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
