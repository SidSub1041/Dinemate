import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { BCRYPT_ROUNDS } from "@/auth";

const schema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(120).optional(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200),
});

export async function POST(req: Request) {
  // Account creation is the classic spam target: 5 per hour per IP.
  const limited = rateLimit(`signup:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Check the form and try again.",
      },
      { status: 400 }
    );
  }
  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name?.trim() || undefined;
  const password = parsed.data.password;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await db.user.create({
    data: { email, name, hashedPassword },
    select: { id: true, email: true, name: true },
  });
  return NextResponse.json({ ok: true, user });
}
