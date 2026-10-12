import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { directUrl } from "./direct-url";
import { sections } from "./schema";
import { ranksAfter } from "../lib/rank";
import { slugify } from "../lib/slug";

config({ path: ".env.local" });
config();

// Starter sections from the original brief. Only inserted into an empty table.
const STARTERS: [string, string][] = [
  ["Work", "slate"],
  ["Study", "cobalt"],
  ["Carta", "coral"],
  ["Cloud Skills", "lagoon"],
  ["Italian", "moss"],
  ["Gift Ideas", "plum"],
];

async function main() {
  const sql = postgres(directUrl(), { max: 1, onnotice: () => {} });
  const db = drizzle(sql);
  const existing = await db.select({ id: sections.id }).from(sections).limit(1);
  if (existing.length === 0) {
    const ranks = ranksAfter(null, STARTERS.length);
    await db.insert(sections).values(
      STARTERS.map(([name, color], i) => ({ name, color, slug: slugify(name), rank: ranks[i] })),
    );
    console.log(`seeded ${STARTERS.length} sections`);
  } else {
    console.log("sections exist, skipping");
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
