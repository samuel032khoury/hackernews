import type { Env } from "hono";
import z from "zod";
import type { Session, User } from "./auth";

export const processEnv = z
	.object({
		DATABASE_URL: z.url(),
		BETTER_AUTH_URL: z.url(),
		BETTER_AUTH_SECRET: z.string(),
		CLIENT_URL: z.url().default("/"),
		PORT: z.string().optional().default("3000"),
		HOSTNAME: z.string().optional().default("localhost"),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	})
	.parse(process.env);

export interface AppEnv extends Env {
	Variables: {
		user: User | null;
		session: Session | null;
	};
}

export interface ProtectedEnv extends Env {
	Variables: {
		user: User;
		session: Session;
	};
}
