import { defineConfig } from "drizzle-kit";
import { processEnv } from "./src/lib/env";

export default defineConfig({
	dialect: "postgresql",
	schema: "src/db/schema/*",
	out: "src/db/drizzle",
	dbCredentials: {
		url: processEnv.DATABASE_URL || "",
	},
});
