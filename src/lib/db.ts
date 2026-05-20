import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a driver adapter (no more direct URL connections).
// We use the pg adapter against Vercel Postgres / Neon.

declare global {
  // eslint-disable-next-line no-var
  var __dinemate_prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  // Runtime prefers the pooled URL; falls back to non-pooled if that's all
  // we have. Vercel injects POSTGRES_URL automatically.
  const connectionString =
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL_NON_POOLING;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL is not set. Paste your Vercel Postgres connection strings into .env.local."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const db: PrismaClient =
  globalThis.__dinemate_prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__dinemate_prisma = db;
}
