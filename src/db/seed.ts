import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { directUrl } from "./direct-url";
import { and, eq } from "drizzle-orm";
import { sections, users } from "./schema";
import { ranksAfter } from "../lib/rank";
import { slugify } from "../lib/slug";

config({ path: ".env.local" });
config();

// Starter sections for the owner. Only inserted when the owner has none.
const STARTERS: [string, string][] = [
  ["Work", "slate"],
  ["Study", "cobalt"],
  ["Carta", "coral"],
  ["Claude Skills", "lagoon"],
  ["Italian", "moss"],
  ["Gift Ideas", "plum"],
];

async function main() {
  const sql = postgres(directUrl(), { max: 1, onnotice: () => {} });
  const db = drizzle(sql);
  const [owner] = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "owner"))).limit(1);
  if (!owner) throw new Error("No owner account; run migrations first");
  const existing = await db.select({ id: sections.id }).from(sections).where(eq(sections.userId, owner.id)).limit(1);
  if (existing.length === 0) {
    const ranks = ranksAfter(null, STARTERS.length);
    await db.insert(sections).values(
      STARTERS.map(([name, color], i) => ({ userId: owner.id, name, color, slug: slugify(name), rank: ranks[i] })),
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
