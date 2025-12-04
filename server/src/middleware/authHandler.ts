import { createMiddleware } from "hono/factory";
import { auth } from "@/lib/auth";

const authHandler = createMiddleware(async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	c.set("user", session?.user ?? null);
	c.set("session", session?.session ?? null);
	await next();
});

export default authHandler;
