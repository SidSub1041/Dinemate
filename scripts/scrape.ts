import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { scrapeMenuData } from "../src/lib/scraper";
import { brandLocations } from "../src/lib/brand-items";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  const date = process.argv[2] || todayISO();
  const out = join(process.cwd(), "src", "data", "menu.json");

  console.log(`Scraping UNC dining menu for ${date}…`);
  const data = await scrapeMenuData(date, undefined, {
    concurrency: 10,
    onProgress: (msg) => console.log(msg),
  });

  // Merge curated brand-restaurant items.
  const brand = brandLocations();
  data.locations.push(...brand);
  console.log(
    `Merged ${brand.length} brand restaurants ` +
      `(${brand.reduce((n, l) => n + Object.values(l.meals).flat().length, 0)} item-slots).`
  );

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(data, null, 2));

  const counts = data.locations.map((l) => ({
    name: l.name,
    breakfast: l.meals.breakfast.length,
    lunch: l.meals.lunch.length,
    late_lunch: l.meals.late_lunch.length,
    dinner: l.meals.dinner.length,
  }));
  console.log("\nSummary:");
  console.table(counts);
  console.log(`Wrote ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
