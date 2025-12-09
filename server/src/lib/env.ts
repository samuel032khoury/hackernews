import type { Session, User } from "better-auth/types";
import type { Env } from "hono";

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
