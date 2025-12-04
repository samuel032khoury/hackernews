import type { Session, User } from "better-auth/types";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AuthContext } from "@/context/authContext";
import { auth } from "@/lib/auth";

export const authMiddleware = createMiddleware<AuthContext>(async (c, next) => {
	let user: User | null = null;
	let session: Session | null = null;

	try {
		// Better Auth typically exposes these methods
		const authHelper = auth as {
			api?: {
				getSession?: (context: {
					headers: Headers;
				}) => Promise<{ user?: User; session?: Session }>;
			};
		};

		if (authHelper.api?.getSession) {
			const result = await authHelper.api.getSession({
				headers: c.req.raw.headers,
			});

			user = result?.user ?? null;
			session = result?.session ?? null;
		}
	} catch (err) {
		// Don't leak implementation details to the client
		console.error("Auth check failed:", err);
	}

	if (!user || !session) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	// Store user and session in context variables
	c.set("user", user);
	c.set("session", session);

	return next();
});

export default authMiddleware;
