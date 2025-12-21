import { authConfig } from "@shared/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, username } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema/auth.schema";
import { processEnv } from "./env";

const PASSWORD_MIN_LENGTH = authConfig.password.minLength;
const PASSWORD_MAX_LENGTH = authConfig.password.maxLength;

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
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user & {
	username: string;
	displayUsername: string;
};
