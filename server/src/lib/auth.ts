import { AUTH_CONSTRAINTS } from "@shared/constants";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, username } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema/auth.schema";
import { processEnv } from "./env";

const PASSWORD_MIN_LENGTH = AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH;
const PASSWORD_MAX_LENGTH = AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH;

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		usePlural: true,
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: PASSWORD_MIN_LENGTH,
		maxPasswordLength: PASSWORD_MAX_LENGTH,
	},
	plugins: [openAPI(), username()],
	trustedOrigins: [processEnv.CLIENT_URL || ""],
}) as ReturnType<typeof betterAuth>;
