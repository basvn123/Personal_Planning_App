import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { directUrl } from "./direct-url";

config({ path: ".env.local" });
config();

async function main() {
  const sql = postgres(directUrl(), { max: 1, onnotice: () => {} });
  await migrate(drizzle(sql), { migrationsFolder: "src/db/migrations" });
  await sql.end();
  console.log("migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
