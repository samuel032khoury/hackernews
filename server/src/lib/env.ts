import type { Env } from "hono";
import z from "zod";
import type { Session, User } from "./auth";

export const processEnv = z
	.object({
		DATABASE_URL: z.url(),
		CLIENT_URL: z.url(),
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
