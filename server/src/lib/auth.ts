import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema/auth.schema";
import { processEnv } from "./env";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		usePlural: true,
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [openAPI()],
	trustedOrigins: [processEnv.CLIENT_URL || ""],
}) as ReturnType<typeof betterAuth>;
