// Loaded by `prisma migrate` / `prisma db push`.
//
// Migrations want the non-pooled connection string (Vercel injects this
// as POSTGRES_URL_NON_POOLING). We fall back through several names so the
// file works locally, on Vercel, and on plain DATABASE_URL setups.
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local also gets loaded so the same vars work in dev.
loadEnv({ path: ".env.local" });

const migrationUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
