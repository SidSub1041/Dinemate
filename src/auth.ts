/**
 * NextAuth v5 configuration.
 *
 * Strategy choices:
 *   - Credentials provider only (email + password). Google / Apple OAuth
 *     can be slotted in later without touching the rest of the stack.
 *   - JWT sessions, not DB sessions. Credentials providers don't write to
 *     the Account table, so JWT is the canonical choice. We embed the
 *     user id on the token so server actions can identify the caller
 *     without a DB roundtrip.
 *   - Session lifetime: 30 days, refreshed on every request.
 *   - Bcrypt with 12 rounds for the password hash.
 *   - All sign-in errors surface as a single "Invalid credentials"
 *     message — we don't leak which half of the pair was wrong.
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const BCRYPT_ROUNDS = 12;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    Credentials({
      name: "Email + password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.hashedPassword) return null;
        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First sign-in: copy the user id onto the token.
      if (user && "id" in user && user.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
