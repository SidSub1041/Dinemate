# Dinemate

An editorial meal planner for UNC Chapel Hill. Tell it your goals; it returns a 7-day plan built from real Carolina Dining Services menus.

By **Sid Subramanian**, powered by **Next.js**.

## Stack

- Next.js 16 · App Router · TypeScript
- Tailwind CSS v4 + Fraunces (display) / Geist (sans/mono)
- `cheerio` for scraping `dining.unc.edu`
- Mifflin-St Jeor BMR + activity multiplier + goal delta
- Greedy beam-search optimizer over the menu

## Develop

```bash
npm install
npm run scrape          # refresh src/data/menu.json (today's date)
npm run scrape 2026-09-01   # specific date
npm run dev             # http://localhost:3000
```

## Deploy (Vercel)

1. Push to GitHub.
2. Import into Vercel — framework is auto-detected as Next.js.
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://dinemate.app`). This is used for OG image, sitemap, and canonical URLs.
4. Build and deploy.

The menu cache (`src/data/menu.json`) is **bundled at build time**. To refresh:

```bash
npm run scrape && git commit -am "refresh menu" && git push
```

A redeploy regenerates the plan with the new data. For automated daily refreshes, hook a GitHub Action up to a Vercel Deploy Hook that runs `npm run scrape` on a cron, commits, and triggers a rebuild.

## Project layout

```
src/
  app/
    layout.tsx                root layout, fonts, metadata
    page.tsx                  landing -> wizard -> plan flow
    opengraph-image.tsx       generated OG image (edge runtime)
    icon.tsx, apple-icon.tsx  generated favicons
    robots.ts, sitemap.ts     SEO
    api/plan/route.ts         POST -> PlanResult
  components/
    OnboardingWizard.tsx      4-step form (vitals -> activity -> goal -> diet)
    PlanView.tsx              7-day plan, magazine-style
    ui/                       Button, Card, Input, Stat, SegmentedControl, Chip, Progress
  lib/
    nutrition.ts              Mifflin-St Jeor + macro math
    optimizer.ts              greedy meal picker
    scraper.ts                cheerio-based UNC dining scraper
    types.ts                  shared types
  data/
    menu.json                 cached menu (regenerate with `npm run scrape`)
scripts/
  scrape.ts                   CLI runner for the scraper
```

## Notes

Dinemate is an independent project. Not affiliated with the University of North Carolina at Chapel Hill or Carolina Dining Services. Calorie targets are estimates intended for general guidance, not medical advice.
