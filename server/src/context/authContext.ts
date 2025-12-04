import type { Session, User } from "better-auth/types";
import type { Env } from "hono";

export interface AuthContext extends Env {
	Variables: {
		user: User | null;
		session: Session | null;
	};
}
