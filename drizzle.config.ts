import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { directUrl } from "./src/db/direct-url";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: directUrl(),
  },
  strict: true,
});
