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
  const connectionString =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL / DATABASE_URL is not set. Run `npx vercel env pull .env.local` after provisioning Vercel Postgres."
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
