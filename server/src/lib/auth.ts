import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema/auth.schema";

export const auth = betterAuth({
	basePath: "/auth",
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		usePlural: true,
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [openAPI()],
	trustedOrigins: [process.env.CLIENT_URL || ""],
}) as ReturnType<typeof betterAuth>;
