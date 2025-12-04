import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import type { Session, User } from "better-auth/types";
import type { Env } from "hono";
import { db } from "@/db";
import * as schema from "@/db/schema/auth.schema";

export interface AuthEnv extends Env {
	Variables: {
		user: User | null;
		session: Session | null;
	};
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [openAPI()],
	trustedOrigins: [process.env.CLIENT_URL || ""],
}) as ReturnType<typeof betterAuth>;
